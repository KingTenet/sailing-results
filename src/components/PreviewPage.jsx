import React from 'react';
import TabletDeviceWrapper from './TabletDeviceWrapper';

const FeatureList = () => (
  <div className="text-white space-y-8 max-w-xl">
    <h1 className="text-4xl font-bold mb-8">NHEBSC Racing Results</h1>
    
    <div className="space-y-4">
      <div className="feature-item">
        <h3 className="text-xl font-semibold mb-2">Real-time Race Management</h3>
        <p className="text-gray-200">Register helms, record finishes, and manage race results with an intuitive drag-and-drop interface.</p>
      </div>

      <div className="feature-item">
        <h3 className="text-xl font-semibold mb-2">Advanced Handicap System</h3>
        <p className="text-gray-200">Automatic calculation of personal and class handicaps with rolling averages and novice adjustments.</p>
      </div>

      <div className="feature-item">
        <h3 className="text-xl font-semibold mb-2">Series Tracking</h3>
        <p className="text-gray-200">Comprehensive series points calculation with support for discards and OOD points.</p>
      </div>

      <div className="feature-item">
        <h3 className="text-xl font-semibold mb-2">Offline Capable</h3>
        <p className="text-gray-200">Full offline functionality with automatic synchronization when connection is restored.</p>
      </div>

      <div className="feature-item">
        <h3 className="text-xl font-semibold mb-2">Multi-format Racing</h3>
        <p className="text-gray-200">Support for both fleet and pursuit racing with specialized result handling for each format.</p>
      </div>
    </div>
  </div>
);

const PreviewPage = ({ children }) => {
  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center">
      {/* Background Image with Color Filter */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 saturate-100 brightness-150 opacity-80"
        style={{ 
          backgroundImage: 'url(/sailing-background.jpg)', // You'll need to add this image
        }}
      >
        {/* Color Overlay - adjust hue by changing the color and opacity */}
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundColor: 'rgb(0 87 109)', // Change this color to adjust the hue
            opacity: 0.5,
            mixBlendMode: 'multiply'
          }} 
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-8xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Features */}
          <div className="hidden lg:flex justify-end pr-8">
            <FeatureList />
          </div>

          {/* Right Side - Tablet Preview */}
          <div className="w-full flex justify-start pl-8">
            <div className="transform scale-100 origin-center">
              <TabletDeviceWrapper>
                {children}
              </TabletDeviceWrapper>
            </div>
          </div>

          {/* Mobile Features - Only shown on smaller screens */}
          <div className="lg:hidden">
            <FeatureList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;