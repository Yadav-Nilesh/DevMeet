import { io } from "socket.io-client";

const URL =
  process.env.NODE_ENV === "production"
    ? "https://devmeet-xp51.onrender.com"
    : "http://localhost:5000";

export const socket = io(URL, {
  autoConnect: false, // 🔒 Don't connect immediately
});
