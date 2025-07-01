import React, { useRef } from "react";
import { gsap } from "gsap";
import "./SpotlightButton.css";

const SpotlightButton = ({
  children,
  onClick,
  gradient = "linear-gradient(to right, #4f46e5, #818cf8)",
  hoverTextColor = "#0a0a0a",
  className = "",
  style = {},
  textStyle = {},
  type = "button", // ✅ default to 'button'
  ...rest // ✅ capture any extra props like 'disabled'
}) => {
  const buttonRef = useRef();
  const spotlightRef = useRef();

  const handleMouseMove = (e) => {
    const rect = buttonRef.current.getBoundingClientRect();
    const movX = e.clientX - rect.left;
    gsap.to(spotlightRef.current, {
      x: movX,
      scale: 30,
      duration: 0.3,
    });
  };

  const handleMouseLeave = (e) => {
    const rect = buttonRef.current.getBoundingClientRect();
    const movX = e.clientX - rect.left;
    gsap.to(spotlightRef.current, {
      x: movX,
      scale: 0,
      duration: 0.3,
    });
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      className={`spotlight-button ${className}`}
      style={{
        "--hoverTextColor": hoverTextColor,
        ...style,
      }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...rest} // ✅ forward any extra props like aria-label, disabled
    >
      <span
        className="button__spotlight"
        ref={spotlightRef}
        style={{ background: gradient }}
      />
      <span
        className="button__text"
        style={{
          whiteSpace: "nowrap",
          ...textStyle,
        }}
      >
        {children}
      </span>
    </button>
  );
};

export default SpotlightButton;
