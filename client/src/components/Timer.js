import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import PlayButton from "./PlayButton";
import ResetButton from "./ResetButton";
import SpotlightButton from "./SpotlightButton";

export default function Timer({ roomId }) {
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const hasAnnouncedTimeout = useRef(false);
  const hasRestored = useRef(false);



  // Convert seconds to mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!roomId || hasRestored.current) return;
  
    const saved = JSON.parse(localStorage.getItem(`timer-${roomId}`));
    if (saved) {
      setTimeLeft(saved.timeLeft ?? 1800);
      setIsRunning(saved.isRunning ?? false);
      console.log("🧠 Restored timer:", saved);
    }
  
    hasRestored.current = true;
  }, [roomId]);
  
  // ⏹️ Listen to reset-timer only AFTER state is restored
useEffect(() => {
  const handleReset = () => {
    if (!hasRestored.current) return; // ✅ prevent overwriting restored state
    console.log("🔄 Received reset-timer");
    setTimeLeft(1800);
    setIsRunning(false);
  };

  socket.on("reset-timer", handleReset);

  return () => socket.off("reset-timer", handleReset);
}, [roomId]);


  useEffect(() => {
    localStorage.setItem(`timer-${roomId}`, JSON.stringify({
      timeLeft,
      isRunning,
    }));
  }, [timeLeft, isRunning, roomId]);
  

  // Handle timer ticks
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
  
          // ⏰ Only the first client to hit 0 announces it
          if (newTime === 0 && !hasAnnouncedTimeout.current) {
            hasAnnouncedTimeout.current = true; // prevent duplicates
  
            socket.emit("send-message", {
              roomId,
              sender: "System",
              text: "⏰ Time's up! Interview session ended.",
            });
  
            alert("⏰ Time's up!");
          }
  
          socket.emit("timer-tick", { roomId, timeLeft: newTime });
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
  
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft, roomId]);
  
  

  // Listen for tick events from server
  useEffect(() => {
    socket.on("timer-tick", ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socket.on("start-timer", () => setIsRunning(true));
    socket.on("pause-timer", () => setIsRunning(false));
    socket.on("reset-timer", () => {
      setIsRunning(false);
      setTimeLeft(1800);
    });

    socket.on("add-time", (seconds) => {
      console.log("🕒 Added time received:", seconds);
      setTimeLeft((prev) => prev + seconds);
    });
    

    return () => {
      socket.off("timer-tick");
      socket.off("start-timer");
      socket.off("pause-timer");
      socket.off("reset-timer");
      socket.off("add-time");
    };
  }, [roomId]);


  useEffect(() => {
    const handleSync = ({ timeLeft, isRunning }) => {
      console.log("⏱️ Synced from server:", timeLeft, isRunning);
      setTimeLeft(timeLeft);
      setIsRunning(isRunning);
    };
  
    socket.on("sync-timer", handleSync);
  
    return () => {
      socket.off("sync-timer", handleSync);
    };
  }, []);
  

  const handleStart = () => {
    console.log("🟢 Sending start-timer");
    socket.emit("start-timer", roomId);
  };

  const handlePause = () => {
    socket.emit("pause-timer", roomId);
  };

  const handleReset = () => {
    socket.emit("reset-timer", roomId);
  };

  const handleAdd15Min = () => {
    socket.emit("add-time", { roomId, seconds: 900 }); // 900 = 15 minutes
  };
  

  return (
    <div
  className="timer-box"
  style={{
    background: "#111",
    color: "#fff",
    padding: "16px",
    marginTop: "0px",
    borderRadius: "15px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px"
  }}
>
  {/* 🕒 Timer Display */}
  <h3 style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
    {formatTime(timeLeft)}
  </h3>

  {/* ▶️ Start & ⏸️ Pause on the same line */}
  <div style={{ display: "flex", gap: "10px" }}>
    <PlayButton
      onClick={handleStart}
      type="play"
      color="#4ade80"
      style={{
        
        padding: "6px 12px",
      }}
    >
      ▶️
    </PlayButton>
    <PlayButton
      onClick={handlePause}
      type="pause"
  color="#f87171"
      style={{
        padding: "6px 12px",
        backgroundColor: "#ffc107",
        color: "black",
        border: "none",
        borderRadius: "4px"
      }}
    >
      ⏸️
    </PlayButton>
  </div>

  {/* 🔁 Reset */}
  <ResetButton
    onClick={handleReset}
    style={{
      width: "100%",
      padding: "6px 0",
      backgroundColor: "#17a2b8",
      color: "white",
      border: "none",
      borderRadius: "4px"
    }}
  >
    Reset
  </ResetButton>

  {/* ➕ Add 15 min */}
  <SpotlightButton
  onClick={handleAdd15Min}
  gradient="linear-gradient(to right, #8b5cf6, #a78bfa)"
  hoverTextColor="#000000"
  style={{
    width: "100%",
    padding: "10px 0",      // outer padding
    borderRadius: "20px",
  }}
  textStyle={{
    fontSize: "0.8rem",        // text size
    padding: "1px 10px",     // inner text padding
    color: "white",          // text color before hover
  }}
>
  Add 15 min
</SpotlightButton>
</div>


  );
}
