import React, { useRef } from "react";
import { gsap } from "gsap";

const ResetButton = ({ onClick, color = "#38bdf8", size = 38 }) => {
  const btnRef = useRef(null);

  const handleClick = () => {
    const tl = gsap.timeline();
    tl.to(btnRef.current, { rotation: -15, duration: 0.1 })
      .to(btnRef.current, { rotation: 15, duration: 0.1, repeat: 3, yoyo: true })
      .to(btnRef.current, { rotation: 0, duration: 0.1 })
      .to(btnRef.current, { fill: "#ffffff", duration: 0.2 })
      .to(btnRef.current, { fill: color, duration: 0.2 });
    onClick?.();
  };

  return (
    <svg
      ref={btnRef}
      onClick={handleClick}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className="cursor-pointer"
    >
      {/* ⟳ Circular Reset Icon */}
      <path d="M12 5V1L7 6l5 5V7c2.76 0 5 2.24 5 5a5 5 0 0 1-5 5c-1.5 0-2.85-.66-3.77-1.71l-1.46 1.46A7 7 0 0 0 19 12c0-3.87-3.13-7-7-7z" />
    </svg>
  );
};

export default ResetButton;
