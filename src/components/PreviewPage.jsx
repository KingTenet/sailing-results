import React from "react";
import TabletDeviceWrapper from "./TabletDeviceWrapper";

// Feature list component - displays app features on the left side
const FeatureList = () => (
  <div className="text-gray-100 space-y-8 max-w-xl ">
    <div className="flex">
      <div className="h-24 w-24 mr-2 rotate-90 fill-slate-100">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
          <path d="M526-129q-5 4-10.5 6t-10.5 2q-6 0-11-2t-10-7q-41-43-61-89t-20-96q0-36 11-76.5T453-501q26-60 35-92.5t9-59.5q0-38-16.5-71T429-789q-5-5-7-10.5t-2-11.5q0-5 1.5-10t5.5-10q5-5 10.5-7.5T449-841q5 0 10.5 2t10.5 7q44 41 65.5 85t21.5 94q0 34-10 71.5T509-478q-26 61-36 96.5T463-316q0 39 16 74.5t49 70.5q4 5 5.5 10t1.5 10q0 6-2 11.5t-7 10.5Zm203 1q-5 4-10 5.5t-10 1.5q-6 0-11.5-2t-10.5-7q-41-43-61-88.5T606-314q0-36 11-76.5T656-500q26-60 35-92.5t9-59.5q0-38-16.5-70.5T632-788q-5-5-6.5-10t-1.5-11q0-5 1.5-10.5T631-830q5-5 10.5-7t11.5-2q5 0 10 1.5t10 5.5q44 41 65.5 85t21.5 94q0 34-10 71t-38 105q-26 60-36 95.5T666-316q0 39 16 75.5t49 70.5q4 5 5.5 10t1.5 10q0 6-2 11.5t-7 10.5Zm-406 0q-5 4-10 5.5t-10 1.5q-6 0-11.5-2t-10.5-7q-41-43-61-88.5T200-314q0-36 11-76.5T250-500q26-60 35-92.5t9-59.5q0-38-16.5-70.5T226-788q-5-5-7-10.5t-2-11.5q0-5 1.5-10.5T224-831q5-5 10.5-7.5T246-841q5 0 10.5 2t10.5 7q44 41 65.5 85t21.5 94q0 34-10.5 72.5T306-477q-25 60-35 95t-10 66q0 40 16 76t48 70q4 5 5.5 10t1.5 10q0 6-2 11.5t-7 10.5Z" />
        </svg>
      </div>

      <div className="flex flex-col align-middle justify-around">
        <h1 className="text-8xl w-full font-extralight font-h1 uppercase tracking-widest">
          WindSheet
        </h1>
        <h2 className="text-3xl w-full ml-3 font-light mb-8 font-h2 ">
          Racing results, refined
        </h2>
      </div>
    </div>

    <div className="space-y-6">
      <div className="feature-item">
        <h3 className="text-xl mb-2">Real-time Race Management</h3>
        <p>
          Register helms, record finishes, and manage race results with an
          intuitive drag-and-drop interface.
        </p>
      </div>

      <div className="feature-item">
        <h3 className="text-xl mb-2">Advanced Handicap System</h3>
        <p>
          Automatic calculation of personal and class handicaps with rolling
          averages and novice adjustments.
        </p>
      </div>

      <div className="feature-item">
        <h3 className="text-xl mb-2">Series Tracking</h3>
        <p>
          Comprehensive series points calculation with support for discards and
          OOD points.
        </p>
      </div>

      <div className="feature-item">
        <h3 className="text-xl mb-2">Offline Capable</h3>
        <p>
          Full offline functionality with automatic synchronization when
          connection is restored.
        </p>
      </div>

      <div className="feature-item">
        <h3 className="text-xl mb-2">Multi-format Racing</h3>
        <p>
          Support for both fleet and pursuit racing with specialized result
          handling for each format.
        </p>
      </div>
    </div>
  </div>
);

const PreviewPage = ({ children }) => {
  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center">
      {/* Background Image with Color Filter */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 bg-white saturate-200 brightness-100 opacity-80"
        style={{
          backgroundImage: "url(/sailing-background.jpg)", // You'll need to add this image
        }}
      >
        {/* Color Overlay - adjust hue by changing the color and opacity */}
        <div
          className="absolute inset-0 brightness-90 bg-gradient-to-tr from-[rgb(var(--dusky-blue))] via-50% via-slate-500 to-[rgb(var(--teal))]"
          style={{
            // backgroundColor: 'rgb(0 87 109)', // Change this color to adjust the hue
            opacity: 1,
            mixBlendMode: "multiply",
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-screen-lg max-w-8xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Side - Features */}
          <div className="hidden lg:flex justify-center pr-8 col-span-6">
            <FeatureList />
          </div>
          {/* Right Side - Tablet Preview */}
          <div className="flex justify-center pl-8 col-span-6">
            <div className="transform scale-100 origin-center">
              <TabletDeviceWrapper>{children}</TabletDeviceWrapper>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;
