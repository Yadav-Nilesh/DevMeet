import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Particles from "../components/Particles";
import SplitText from "../components/SplitText";
import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import SpotlightButton from "../components/SpotlightButton";
import LoginCard from "../components/LoginCard";
import SignupCard from "../components/SignupCard";
import { useLocation } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  
  const handleCreateRoom = async () => {
    const username = localStorage.getItem("username");
    if (!username) {
      alert("❗ Please login or sign up first.");
      return;
    }
  
    const roomId = uuidv4();
  
    try {
      // 🧠 Store the new room in MongoDB
      const res = await fetch("https://devmeet-xp51.onrender.com/create-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        console.error("Room creation failed:", data);
        alert("❌ Failed to create room on server.");
        return;
      }
  
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Room creation error:", error);
      alert("❌ Could not connect to server.");
    }
  };
  

  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/";
  };

  const [showJoinModal, setShowJoinModal] = useState(false);

  const [showLoginModal, setShowLoginModal] = useState(false);

  const [showSignupModal, setShowSignupModal] = useState(false);

  const [roomIdToJoin, setRoomIdToJoin] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleJoinRoom = async () => {
    if (!roomIdToJoin.trim()) {
      alert("Please enter a Room ID.");
      return;
    }

    try {
      const res = await fetch(
        `https://devmeet-xp51.onrender.com/room-exists/${roomIdToJoin}`
      );
      const data = await res.json();

      if (!data.exists) {
        alert("Room does not exist!");
        return;
      }

      socket.emit("join-room", { roomId: roomIdToJoin, username });
      navigate(`/room/${roomIdToJoin}`);
    } catch (err) {
      console.error("Error checking room existence", err);
      alert("Something went wrong while joining the room.");
    }
  };

  useEffect(() => {
    if (location.state?.openCreateRoom) {
      handleCreateRoom();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  return (
    <div className="relative min-h-screen text-white overflow-hidden bg-black">
      {/* 🔵 Particles Background */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <Particles
          particleColors={["#ffffff", "#00bfff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      {/* 🧊 Dark overlay for contrast */}
      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-60 z-0" />

      {/* 🔒 Foreground content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Top left logo section */}
        <div className="absolute top-6 left-6 text-white">
          <h2 className="text-3xl font-bold text-blue-400">DevMeet</h2>
          <p className="text-sm text-gray-300 mt-1">
            Your collaborative coding space
          </p>
        </div>

        {/* 🌀 SplitText Welcome Message */}
        <div className="absolute top-[25%] text-center text-4xl sm:text-5xl font-bold">
          <div className="inline-block">
            <SplitText
              text="Welcome to " // ← make sure there's a space here
              className="inline-block text-white"
              delay={100}
              duration={0.6}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
            />
            <span className="inline-block">&nbsp;</span>
            <SplitText
              text="DevMeet . . "
              className="inline-block text-blue-400"
              delay={100}
              duration={0.6}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
            />
          </div>
          <p className="text-sm font-thin text-white-400">
            Your virtual hub for mock interviews and real-time coding.
          </p>
        </div>

        {/* 👤 Login or Action Buttons */}
        {username ? (
          <>
            <p className="text-2xl mb-6">
              Welcome <strong className="text-green-400">{username}</strong>
            </p>

            <div className=" space-x-10">
              <SpotlightButton
                onClick={handleCreateRoom}
                gradient="linear-gradient(to right, #16a34a, #4ade80)"
                className="bg-orange-500 hover:bg-slate-700 px-6 py-3 rounded-4xl  shadow"
              >
                Create Room
              </SpotlightButton>

              <SpotlightButton
                onClick={() => setShowJoinModal(true)}
                gradient="linear-gradient(to right, #42A5F5,#42A5F5)"
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-4xl text-white text-lg font-medium shadow"
              >
                🔗 Join Room
              </SpotlightButton>

              <SpotlightButton
                onClick={handleLogout}
                gradient="linear-gradient(to right, #FFA726,#FFA726)"
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-4xl text-white text-lg font-medium shadow"
              >
                Logout
              </SpotlightButton>
            </div>
          </>
        ) : (
          <div className="space-x-10 mt-6">
            <SpotlightButton
              onClick={() => setShowLoginModal(true)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-4xl text-white text-lg font-medium shadow"
            >
              Login
            </SpotlightButton>

            <SpotlightButton
              onClick={() => setShowSignupModal(true)}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-4xl text-white text-lg font-medium shadow"
            >
              Signup
            </SpotlightButton>
          </div>
        )}
      </div>

      {/* 🔲 Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white mb-4 text-center">
              Join a Room
            </h2>
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomIdToJoin}
              onChange={(e) => setRoomIdToJoin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleJoinRoom();
                }
              }}
              className="w-full p-2 mb-4 rounded-2xl border border-gray-400 bg-white bg-opacity-80 text-black placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-orange-400 text-white rounded-3xl transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinRoom}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-green-500 text-white rounded-3xl transition duration-200"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <LoginCard onClose={() => setShowLoginModal(false)} />
        </div>
      )}

      {showSignupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <SignupCard onClose={() => setShowSignupModal(false)} />
        </div>
      )}


<footer className="fixed bottom-0 left-0 w-full bg-transparent backdrop-blur-md text-white text-center py-2 border-t border-none z-50">
  <p className="text-sm font-light tracking-wide">
    © {new Date().getFullYear()} Developed with ❤️ by <span className="font-semibold">Nilesh </span> | All rights reserved.
  </p>
</footer>




    </div>
  );
}
