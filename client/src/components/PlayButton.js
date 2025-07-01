// src/components/PlayButton.js
import { useRef, useEffect } from "react";
import { gsap } from "gsap";

const PlayButton = ({ onClick, type = "play", color = "#4ade80", size = 80 }) => {
  const circleRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      circleRef.current,
      { scale: 1 },
      {
        scale: 1.08,
        repeat: -1,
        yoyo: true,
        duration: 1,
        ease: "power1.inOut",
      }
    );
  }, []);

  return (
    <svg
      width= "38"
      height="38"
      viewBox="0 0 100 100"
      onClick={onClick}
      className="cursor-pointer hover:scale-110 transition duration-300"
    >
      <circle
        ref={circleRef}
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke={color}
        strokeWidth="4"
      />
      {type === "play" && <polygon points="40,30 70,50 40,70" fill={color} />}
      {type === "pause" && (
        <>
          <rect x="38" y="30" width="8" height="40" fill={color} />
          <rect x="54" y="30" width="8" height="40" fill={color} />
        </>
      )}
    </svg>
  );
};

export default PlayButton;
