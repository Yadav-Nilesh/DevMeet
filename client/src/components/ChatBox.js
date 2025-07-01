import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import SendButton from "./SendButton";
// import "./ChatBox.css";

export default function ChatBox({ roomId }) {
  const username = localStorage.getItem("username") || "Anonymous";
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const firstLoadRef = useRef(true); // 💡 Prevent duplicate join messages on refresh
  const hasLoadedRef = useRef(false);

  // ✅ Load chat from localStorage on mount
  useEffect(() => {
    if (!roomId || hasLoadedRef.current) return;

    const saved = localStorage.getItem(`chat-${roomId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          console.log("🧠 Chat restored from:", roomId, parsed);
          setMessages(parsed);
        }
      } catch (e) {
        console.error("❌ Failed to parse chat:", e);
      }
    }

    hasLoadedRef.current = true; // ✅ Load only once!
  }, [roomId]);

  // ✅ Save chat to localStorage whenever it changes
  useEffect(() => {
    if (!roomId || !Array.isArray(messages)) return;
    localStorage.setItem(`chat-${roomId}`, JSON.stringify(messages));
  }, [messages, roomId]);

  useEffect(() => {
    const handleReceive = ({ sender, text }) => {
      console.log("📥 Message from", sender, ":", text);
      setMessages((prev) => [...prev, { sender, text }]);
    };

    const handleUserJoined = (joinedUsername) => {
      // 👤 Skip your own "joined" message on refresh
      if (firstLoadRef.current && joinedUsername === username) {
        firstLoadRef.current = false;
        return;
      }

      console.log(`👤 ${joinedUsername} joined`);
      setMessages((prev) => [
        ...prev,
        { sender: "System", text: `${joinedUsername} joined the room.` },
      ]);
    };

    const handleUserLeft = (leftUsername) => {
      console.log(`👤 ${leftUsername} left`);
      setMessages((prev) => [
        ...prev,
        { sender: "System", text: `${leftUsername} left the room.` },
      ]);
    };

    socket.on("receive-message", handleReceive);
    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("receive-message", handleReceive);
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
    };
  }, [roomId, username]);

  const handleSend = () => {
    if (!message.trim()) return;
    socket.emit("send-message", { roomId, sender: username, text: message });
    // setMessages((prev) => [...prev, { sender: "You", text: message }]);
    setMessage("");
  };

  // ✅ Embedded Chat UI (no toggling, no floating)
  return (
    <div className="flex flex-col h-full text-white">
      {/* 🗨️ Chat Header */}
      <div className="font-bold text-b mb-1"><h1>Chats</h1></div>

      {/* 📜 Messages */}
      <div className="flex-1 overflow-y-auto bg-[#121212] rounded border border-none p-2 text-sm mb-2">
  {messages.map((m, i) => (
    <div
      key={i}
      className={
        m.sender === "System"
          ? "text-gray-400 italic"
          : "mb-1"
      }
    >
      {m.sender !== "System" && (
        <span
          className={`font-semibold mr-1 ${
            m.sender === username ? "text-green-400" : "text-blue-400"
          }`}
        >
          {m.sender}:
        </span>
      )}
      <span>{m.text}</span>
    </div>
  ))}
</div>


      {/* ✍️ Input Area */}
      <div className="flex gap-2">
  {/* Fixed basis (width) for input, no grow */}
  <input
    type="text"
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    placeholder="Type your message..."
    className="basis-3/4 px-3 py-2 rounded-2xl bg-[#323232] border border-none text-white text-sm"
    onKeyDown={(e) => e.key === "Enter" && handleSend()}
  />

  {/* Let SendButton take remaining space */}
  <SendButton
    onClick={handleSend}
    className="flex-grow h-10 text-sm rounded-md"
  >
    Send
  </SendButton>
</div>


    </div>
  );
}
