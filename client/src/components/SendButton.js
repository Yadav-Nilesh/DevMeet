import React, { useRef } from "react";
import "./SendButton.css";

const SendButton = ({ onClick }) => {
  const iconRef = useRef(null);

  const handleClick = () => {
    if (iconRef.current) {
      iconRef.current.classList.add("animate-out");
      setTimeout(() => {
        iconRef.current.classList.add("animate-back");
        setTimeout(() => {
          iconRef.current.classList.remove("animate-out", "animate-back");
        }, 1500);
      }, 1500);
    }

    onClick?.();
  };

  return (
    <button className="sendButton" onClick={handleClick}>
      <div className="text">Send</div>
      <div className="icon" ref={iconRef}>
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          viewBox="0 0 388.6 388.6"
        >
          <polygon
            className="st0"
            points="173.5,215.5 215.5,369.6 369.6,19.4 369.2,19 19,173.1 173.1,215.1"
          />
        </svg>
      </div>
    </button>
  );
};

export default SendButton;
