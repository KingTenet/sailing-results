import React from 'react';
import { useEffect, useState } from 'react';

export const TabletDeviceWrapper = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  
  // Original tablet dimensions
  const TABLET_WIDTH = 600;
  const TABLET_HEIGHT = 888;
  
  // Scale factor (e.g., 0.75 = 75% of original size)
  const SCALE = 0.6;
  
  // Calculate scaled dimensions
  const scaledWidth = TABLET_WIDTH * SCALE;
  const scaledHeight = TABLET_HEIGHT * SCALE;
  
  // Calculate the difference to offset the scaling
  const offsetX = (TABLET_WIDTH - scaledWidth) / 2;
  const offsetY = (TABLET_HEIGHT - scaledHeight) / 2;

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  if (isMobile) {
    return <>{children}</>;
  }

//   <div className="relative">
{/* Tablet Frame */}
  return (
        <div className="bg-gray-800 rounded-[40px] p-8 shadow-xl">
          {/* Camera */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gray-700" />
          
          {/* Screen Container - Fixed size of tablet */}
          <div className={`
            relative
            bg-white
            rounded-[20px]
            overflow-y-scroll
            `}
            style={{
                height: `${scaledHeight}px`,
                width: `${scaledWidth}px`
            }}
          >
            {/* Content Wrapper - Scaled and centered */}
            <div 

style={{
                  transform: `scale(${SCALE})`,
                  transformOrigin: 'top left',
                  width: `${(100/SCALE)}%`,
                  height: `${(100/SCALE)}%`,
                  position: 'absolute',
                //   left: `${offsetX}px`,
                //   top: `${offsetY}px`
                }}
            >
              {children}
            </div>
          </div>

          {/* Home Button */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-4 border-gray-700" />
        </div>
  );
      {/* </div> */}
};

export default TabletDeviceWrapper;