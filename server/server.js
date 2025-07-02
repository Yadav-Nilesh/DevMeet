const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { Server } = require('socket.io');
const authRoutes = require("./routes/authRoutes");

const { exec } = require("child_process");
const fs = require("fs"); 

dotenv.config();
const app = express();
const server = http.createServer(app); // ✅ MUST use http.createServer

app.use(cors({
  origin: ['http://localhost:3000', 'https://devmeet-five.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json());
app.use("/api", authRoutes);

// ✅ Initialize Socket.io with correct CORS config
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://devmeet-five.vercel.app'],
    methods: ['GET', 'POST'],
  },
});

const roomUsers = new Map(); // { roomId: [{ socketId, username }] }
const socketToUser = new Map(); // { socketId: { roomId, username } }
const roomTimers = new Map(); // 🧠 Tracks latest timer state per room
const activeRooms = new Set();



// ✅ Socket connection
io.on('connection', (socket) => {
  console.log(`🟢 User connected: ${socket.id}`);

  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);
    socket.username = username;
    activeRooms.add(roomId);           // ✅ Track the room
    
    // Tell others someone joined
    socket.to(roomId).emit("user-joined-room", { newUserId: socket.id });
    console.log("👋 user-joined-room sent");
  
    // update user list
    // 🆕 Track this user for future disconnect cleanup
socketToUser.set(socket.id, { roomId, username });

const existingUsers = roomUsers.get(roomId) || [];
roomUsers.set(roomId, [...existingUsers, { socketId: socket.id, username }]);

// 🔄 Broadcast updated user list
io.to(roomId).emit("room-users", roomUsers.get(roomId).map(u => u.username));

  });
  
  socket.on("send-latest-code-direct", ({ targetId, code }) => {
    console.log("📤 Sending latest code directly to:", targetId);
    io.to(targetId).emit("send-latest-code", { code });
  });
  
    
  socket.on("timer-tick", ({ roomId, timeLeft }) => {
    const existing = roomTimers.get(roomId) || {};
    roomTimers.set(roomId, { ...existing, timeLeft });
  });

  socket.on("start-timer", (roomId) => {
    const existing = roomTimers.get(roomId) || {};
    roomTimers.set(roomId, { ...existing, isRunning: true });
    io.to(roomId).emit("start-timer");
  });

  socket.on("pause-timer", (roomId) => {
    const existing = roomTimers.get(roomId) || {};
    roomTimers.set(roomId, { ...existing, isRunning: false });
    io.to(roomId).emit("pause-timer");
  });
    
  socket.on("reset-timer", (roomId) => {
    roomTimers.set(roomId, { timeLeft: 1800, isRunning: false });
    io.to(roomId).emit("reset-timer");
  });
    

  socket.on("add-time", ({ roomId, seconds }) => {
    const existing = roomTimers.get(roomId) || { timeLeft: 1800, isRunning: false };
    const updated = {
      ...existing,
      timeLeft: (existing.timeLeft || 0) + seconds,
    };
    roomTimers.set(roomId, updated);
    io.to(roomId).emit("add-time", seconds);
  });
    

    socket.on("request-timer", (roomId) => {
      const timer = roomTimers.get(roomId);
      if (timer) {
        console.log(`⏱️ Sending timer to ${socket.id}:`, timer);
        socket.emit("sync-timer", timer);
      }
    });
  

  socket.on('code-change', ({ roomId, code }) => {
    socket.to(roomId).emit('code-update', code);
    console.log(`🔁 Relaying code to room ${roomId}`);
  });

  socket.on("send-message", ({ roomId, sender, text }) => {
    console.log(`💬 ${sender} in ${roomId}: ${text}`);
    io.to(roomId).emit("receive-message", { sender, text });
  });
  
  

  socket.on('disconnect', () => {
    const userData = socketToUser.get(socket.id);
    if (userData) {
      const { roomId, username } = userData;
      console.log(`❌ ${username} (${socket.id}) disconnected from ${roomId}`);
  // 🔼 Notify others in the room
socket.to(roomId).emit("user-left", username);

      // Remove from roomUsers
      const updatedUsers = (roomUsers.get(roomId) || []).filter(u => u.socketId !== socket.id);
      roomUsers.set(roomId, updatedUsers);
  
      // Broadcast updated user list
      io.to(roomId).emit('room-users', updatedUsers.map(u => u.username));
  
      // Clean up memory
      socketToUser.delete(socket.id);
    } else {
      console.log(`❌ Unknown socket disconnected: ${socket.id}`);
    }
  });
});

app.post("/run", (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "Code and language are required" });
  }

  if (language === "javascript") {
    const jsPath = "./tempCode.js";
    fs.writeFileSync(jsPath, code);

    exec(`node ${jsPath}`, { timeout: 5000 }, (err, stdout, stderr) => {
      if (err) {
        return res.status(400).json({ error: stderr || err.message });
      }
      res.json({ output: stdout });
    });

  } else if (language === "cpp") {
    const cppPath = "./tempCode.cpp";
    const isWindows = process.platform === "win32";
    const exePath = isWindows ? "tempCode.exe" : "./tempCode.out";
    const runCommand = isWindows
    ? `g++ ${cppPath} -o tempCode.exe && tempCode.exe`
    : `g++ ${cppPath} -o ${exePath} && ${exePath}`;

    fs.writeFileSync(cppPath, code);

    // Compile and run the C++ code

exec(runCommand, { timeout: 5000 }, (err, stdout, stderr) => {
      if (err) {
        return res.status(400).json({ error: stderr || err.message });
      }
      res.json({ output: stdout });
    });
  } else {
    return res.status(400).json({ error: "Unsupported language" });
  }
});



// ✅ Start MongoDB and server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Error:', err));

  // ✅ API route to check if a room exists
app.get('/room-exists/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  res.json({ exists: activeRooms.has(roomId) });
});

// ✅ Root route to confirm backend is live
app.get('/', (req, res) => {
  res.send('🚀 DevMeet Backend is Live!');
});

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);
