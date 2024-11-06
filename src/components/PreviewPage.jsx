import React from "react";
import TabletDeviceWrapper from "./TabletDeviceWrapper";

const Feature = ({ title, children }) => {
  return (
    <div className="feature-item mt-4">
      <h3 className="lg:text-xl lg:mb-2 font-semibold">{title}</h3>
      <p className="lg:text-xl text-sm ">{children}</p>
    </div>
  );
};

// Feature list component - displays app features on the left side
const FeatureList = () => (
  <div className="text-gray-100 lg:space-y-8 max-w-xl ">
    <div className="flex lg:w-auto w-full justify-center lg:justify-normal">
      <div className="lg:h-24 lg:w-24 h-10 w-10 translate-y-3 mr-2 rotate-90 fill-slate-100">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
          <path d="M526-129q-5 4-10.5 6t-10.5 2q-6 0-11-2t-10-7q-41-43-61-89t-20-96q0-36 11-76.5T453-501q26-60 35-92.5t9-59.5q0-38-16.5-71T429-789q-5-5-7-10.5t-2-11.5q0-5 1.5-10t5.5-10q5-5 10.5-7.5T449-841q5 0 10.5 2t10.5 7q44 41 65.5 85t21.5 94q0 34-10 71.5T509-478q-26 61-36 96.5T463-316q0 39 16 74.5t49 70.5q4 5 5.5 10t1.5 10q0 6-2 11.5t-7 10.5Zm203 1q-5 4-10 5.5t-10 1.5q-6 0-11.5-2t-10.5-7q-41-43-61-88.5T606-314q0-36 11-76.5T656-500q26-60 35-92.5t9-59.5q0-38-16.5-70.5T632-788q-5-5-6.5-10t-1.5-11q0-5 1.5-10.5T631-830q5-5 10.5-7t11.5-2q5 0 10 1.5t10 5.5q44 41 65.5 85t21.5 94q0 34-10 71t-38 105q-26 60-36 95.5T666-316q0 39 16 75.5t49 70.5q4 5 5.5 10t1.5 10q0 6-2 11.5t-7 10.5Zm-406 0q-5 4-10 5.5t-10 1.5q-6 0-11.5-2t-10.5-7q-41-43-61-88.5T200-314q0-36 11-76.5T250-500q26-60 35-92.5t9-59.5q0-38-16.5-70.5T226-788q-5-5-7-10.5t-2-11.5q0-5 1.5-10.5T224-831q5-5 10.5-7.5T246-841q5 0 10.5 2t10.5 7q44 41 65.5 85t21.5 94q0 34-10.5 72.5T306-477q-25 60-35 95t-10 66q0 40 16 76t48 70q4 5 5.5 10t1.5 10q0 6-2 11.5t-7 10.5Z" />
        </svg>
      </div>

      <div className="flex flex-col align-middle justify-around">
        <h1 className="lg:text-7xl xl:text-8xl text-6xl w-full font-extralight font-h1 uppercase tracking-widest">
          WindSheet
        </h1>
        <h2 className="lg:text-2xl xl:text-3xl text-xl w-full xl:ml-3 lg:ml-2 ml-1 font-light lg:mb-8 mb-2 font-h2 ">
          Racing results, refined
        </h2>
      </div>
    </div>

    <div className="lg:space-y-6 px-2 lg:ml-6">
      <Feature title={"Advanced Handicap System"}>
        {
          <>
            Automatic calculation of personal and class handicaps with rolling
            averages and novice adjustments.
          </>
        }
      </Feature>

      <Feature title={"Series Tracking"}>
        {
          <>
            Comprehensive series points calculation with support for discards
            and OOD points.
          </>
        }
      </Feature>

      <Feature title={"Offline Capable"}>
        {
          <>
            Full offline functionality with automatic synchronization when
            connection is restored.
          </>
        }
      </Feature>

      <Feature title={"Multi-format Racing"}>
        {
          <>
            Support for both fleet and pursuit racing with specialized result
            handling for each format.
          </>
        }
      </Feature>
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
            opacity: 1,
            mixBlendMode: "multiply",
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 lg:max-w-screen-lg mx-auto px-4 my-5 lg:my-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Side - Features */}
          <div className="flex justify-center pr-8 col-span-6">
            <FeatureList />
          </div>
          {/* Right Side - Tablet Preview */}
          <div className="flex justify-center xl:pl-8 col-span-6">
            <div className="hidden lg:block origin-center">
              <TabletDeviceWrapper>{children}</TabletDeviceWrapper>
            </div>
            <div className="lg:hidden origin-center">
              <TabletDeviceWrapper>Try it out</TabletDeviceWrapper>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;
