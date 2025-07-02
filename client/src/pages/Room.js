import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { socket } from "../socket";
import ChatBox from "../components/ChatBox";
import Timer from "../components/Timer";
import axios from "axios";
import SpotlightButton from "../components/SpotlightButton";
import { useNavigate } from 'react-router-dom';


export default function Room() {
  const { roomId } = useParams();
  const [sharedCode, setSharedCode] = useState("// Start typing...");
  const [username] = useState(localStorage.getItem("username") || "Anonymous");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [language, setLanguage] = useState("javascript"); // 🆕 for selecting language
  const [output, setOutput] = useState("");

  const sharedEditorRef = useRef(null); // ✅ used only for shared editor
  const suppressChangeRef = useRef(false);
  const pendingInitialCode = useRef(null);

  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Load from localStorage initially
  useEffect(() => {
    const savedCode = localStorage.getItem(`code-${roomId}`);
    if (savedCode) {
      setSharedCode(savedCode);
    }
  }, [roomId]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      const username = localStorage.getItem("username") || "Anonymous";
      console.log("✅ Connected to socket server:", socket.id);
      socket.emit("join-room", { roomId, username });
      socket.emit("request-timer", roomId);
    };

    socket.on("connect", handleConnect);

    if (socket.connected) {
      handleConnect();
    }

    // 📥 Someone joined — send them the code
    socket.on("user-joined-room", ({ newUserId }) => {
      if (sharedEditorRef.current) {
        const code = sharedEditorRef.current.getValue();
        socket.emit("send-latest-code-direct", {
          targetId: newUserId,
          code,
        });
      }
    });

    // 📥 We received code directly from peer
    socket.on("send-latest-code", ({ code }) => {
      console.log("📥 Received latest code:", code);

      if (sharedEditorRef.current) {
        suppressChangeRef.current = true;
        sharedEditorRef.current.setValue(code);
        suppressChangeRef.current = false;
      } else {
        pendingInitialCode.current = code; // Save for later
      }

      setSharedCode(code);
      localStorage.setItem(`code-${roomId}`, code);
    });

    // 📥 Real-time sync
    socket.on("code-update", (newCode) => {
      console.log("📥 Received code-update:", newCode);
      suppressChangeRef.current = true;
      if (sharedEditorRef.current) {
        sharedEditorRef.current.setValue(newCode);
      }
      suppressChangeRef.current = false;
      setSharedCode(newCode);
      localStorage.setItem(`code-${roomId}`, newCode);
    });

    socket.on("room-users", (users) => {
      console.log("📡 Received online users:", users);
      setOnlineUsers(users);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("user-joined-room");
      socket.off("send-latest-code");
      socket.off("code-update");
      socket.off("room-users");
    };
  }, [roomId, username]);

  const handleDownloadCode = () => {
    const currentCode = sharedEditorRef.current?.getValue();
    if (!currentCode) return;

    const extension = language === "cpp" ? "cpp" : "js";
    const blob = new Blob([currentCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLeaveRoom = () => {
  socket.disconnect(); // disconnect the socket connection
  navigate("/", { state: { openCreateRoom: true } }); // go to home and trigger create room modal
};

  return (
    <div className="font-sans text-white h-screen flex flex-col bg-[#0f0f0f]">
      {/* 🧭 Top Bar */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Room ID: {roomId}</h2>

          <button
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy"}
            className="text-white hover:text-green-400 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>

        <SpotlightButton
  onClick={handleLeaveRoom}
  gradient="linear-gradient(to right, #16a34a, #4ade80)"
  className="bg-orange-600 hover:bg-red-700 text-white px-3 py-1 text-sm rounded-md transition"
>
  Leave Room
</SpotlightButton>



        <div className="text-sm flex items-center gap-2">
  {/* 👤 New SVG Icon */}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-4 h-4 text-green-400"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v1c0 .6.4 1 1 1h18c.6 0 1-.4 1-1v-1c0-3.3-6.7-5-10-5Z" />
  </svg>

  {/* 🟢 Label + Usernames */}
  <span className="text-green-400">Online Users:</span>
  <span className="text-white">
    {onlineUsers.join(", ") || "Loading..."}
  </span>
</div>




      </div>

      {/* 🔀 Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* 📝 Left Side: Editor */}
        <div className="flex-1 resize-x overflow-auto border-r border-none">
          <Editor
            height="100%"
            value={sharedCode}
            theme="vs-dark"
            language={language === "cpp" ? "cpp" : "javascript"}
            onMount={(editor, monaco) => {
              // Define Andromeda theme
              monaco.editor.defineTheme("andromeda", {
                base: "vs-dark",
                inherit: true,
                rules: [
                  { token: "", foreground: "F8F8F8", background: "#111111" },
                  { token: "comment", foreground: "5C6370" },
                  { token: "keyword", foreground: "C678DD" },
                  { token: "number", foreground: "D19A66" },
                  { token: "string", foreground: "98C379" },
                ],
                colors: {
                  "editor.background": "#111111",
                  "editor.foreground": "#F8F8F8",
                  "editor.lineHighlightBackground": "#2c313a",
                  "editorCursor.foreground": "#F8F8F0",
                  "editorWhitespace.foreground": "#3B3A32",
                  "editorIndentGuide.background": "#3B3A32",
                  "editor.selectionBackground": "#49483E",
                },
              });

              // Apply the theme
              monaco.editor.setTheme("andromeda");

              // Save editor instance
              sharedEditorRef.current = editor;

              // Disable validation for C++
              if (language === "cpp") {
                monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(
                  {
                    noSemanticValidation: true,
                    noSyntaxValidation: true,
                  }
                );
              }

              // Load pending code if available
              if (pendingInitialCode.current) {
                suppressChangeRef.current = true;
                editor.setValue(pendingInitialCode.current);
                suppressChangeRef.current = false;
                pendingInitialCode.current = null;
              }

              // Sync code on change
              editor.onDidChangeModelContent(() => {
                if (suppressChangeRef.current) return;
                const value = editor.getValue();
                setSharedCode(value);
                localStorage.setItem(`code-${roomId}`, value);
                socket.emit("code-change", { roomId, code: value });
              });
            }}
          />
        </div>

        {/* 📤 Right Side: Output + Footer + Chat */}
        <div className="w-[40%] flex flex-col justify-between p-4 bg-[#111111]">
          {/* 🧪 Output Panel (Top Half) */}
          <div className="flex flex-col h-[50%] bg-[#111111] text-white p-3 rounded shadow overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Output :</h3>
              <SpotlightButton
                onClick={async () => {
                  try {
                    const res = await axios.post("https://devmeet-xp51.onrender.com/run", {
                      code: sharedCode,
                      language,
                    });
                    setOutput(res.data.output);
                  } catch (err) {
                    setOutput(
                      err.response?.data?.error || "Something went wrong"
                    );
                  }
                }}
                gradient="linear-gradient(to right, #16a34a, #4ade80)"
                textColor="#ffffff"
                hoverTextColor="#000000"
                className="w-fit py-2 px-4 bg-gray-700 text-sm rounded-2xl"
              >
                Run
              </SpotlightButton>
            </div>
            <pre className="whitespace-pre-wrap text-sm">
              {output || "// Output will appear here..."}
            </pre>
          </div>

          {/* 🧭 Bottom Half: Left = Lang/Timer/Download, Right = Chat */}
          <div className="flex mt-4 gap-4 h-[45%]">
            {/* 🛠️ Left Column: Compact Panel */}
            <div className="w-[30%] flex flex-col gap-1.5">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#1e1e1e] border-none text-white px-2 py-1 rounded-lg text-sm"
              >
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
              </select>

              <SpotlightButton
                onClick={handleDownloadCode}
                gradient="linear-gradient(to right, #16a34a, #4ade80)"
                textColor="#4ade80"
                hoverTextColor="#000000"
                className="w-full py-3 px-8 bg-gray-700 text-base rounded-2xl shadow-xl"
              >
                Download
              </SpotlightButton>

              <div className="bg-[#1e1e1e] rounded-3xl p-2 text-sm h-full">
                <Timer roomId={roomId} />
              </div>
            </div>

            {/* 💬 Right Column: Expanded ChatBox */}
            <div className="w-[70%] h-full bg-[#1e1e1e] rounded-2xl p-2 overflow-hidden">
              <ChatBox roomId={roomId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
