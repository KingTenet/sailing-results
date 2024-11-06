import React, { useEffect, useState } from "react";

export const ScaledDiv = ({ children, ...props }) => {
  const [isMobile, setIsMobile] = useState(false);

  // Original tablet dimensions
  const TABLET_WIDTH = 600;
  const TABLET_HEIGHT = 888;

  // Scale factor (e.g., 0.75 = 75% of original size)
  const SCALE = isMobile ? 0.46 : 0.6;

  // Calculate scaled dimensions
  const scaledWidth = TABLET_WIDTH * SCALE;
  const scaledHeight = TABLET_HEIGHT * SCALE;

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  return (
    <div
      style={{
        height: `${scaledHeight}px`,
        width: `${scaledWidth}px`,
      }}
      {...props}
    >
      <div
        className="tablet-screen-container"
        style={{
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
          width: `${100 / SCALE}%`,
          height: `${100 / SCALE}%`,
          position: "absolute",
        }}
      >
        {children}
      </div>
    </div>
  );
};
