import React from "react";
import { ScaledDiv } from "./ScaledDiv";

export const TabletDeviceWrapper = ({ children }) => {
  //   const [isMobile, setIsMobile] = useState(false);

  //   // Original tablet dimensions
  //   const TABLET_WIDTH = 600;
  //   const TABLET_HEIGHT = 888;

  //   // Scale factor (e.g., 0.75 = 75% of original size)
  //   const SCALE = 0.6;

  //   // Calculate scaled dimensions
  //   const scaledWidth = TABLET_WIDTH * SCALE;
  //   const scaledHeight = TABLET_HEIGHT * SCALE;

  //   useEffect(() => {
  //     const checkIfMobile = () => {
  //       setIsMobile(window.innerWidth < 1024);
  //     };

  //     checkIfMobile();
  //     window.addEventListener("resize", checkIfMobile);
  //     return () => window.removeEventListener("resize", checkIfMobile);
  //   }, []);

  //   if (isMobile) {
  //     return <>{children}</>;
  //   }

  return (
    <div className="bg-gray-800 rounded-[40px] p-8 shadow-xl">
      {/* Camera */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-700" />

      {/* Screen Container - Fixed size of tablet */}
      <ScaledDiv
        className={`
        preview-scroll-container
        relative
        bg-white
        rounded-[20px]
        overflow-y-scroll
      `}
      >
        {children}
      </ScaledDiv>
    </div>
  );
};

export default TabletDeviceWrapper;
