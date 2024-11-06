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
    <div className="relative bg-gray-800 lg:rounded-[40px] rounded-[20px] lg:p-[32px] p-[20px] shadow-xl">
      {/* Camera */}
      <div className="absolute lg:top-4 top-2 left-1/2 -translate-x-1/2 lg:w-2 lg:h-2 w-1 h-1 rounded-full bg-gray-700" />

      {/* Screen Container - Fixed size of tablet */}
      <ScaledDiv
        className={`
        preview-scroll-container
        relative
        bg-white
        lg:rounded-[20px]
        rounded-[10px]
        overflow-y-scroll
      `}
      >
        {children}
      </ScaledDiv>
    </div>
  );
};

export default TabletDeviceWrapper;
