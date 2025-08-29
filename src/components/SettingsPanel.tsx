"use client";

import React from "react";

interface SettingsPanelProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  labelSize: number;
  setLabelSize: (value: number) => void;
  nodeSize: number;
  setNodeSize: (value: number) => void;
  strokeWidth: number;
  setStrokeWidth: (value: number) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isDarkMode,
  setIsDarkMode,
  labelSize,
  setLabelSize,
  nodeSize,
  setNodeSize,
  strokeWidth,
  setStrokeWidth
}) => {
  return (
    <div className={`fixed top-4 left-4 z-20 backdrop-blur-sm border rounded-lg p-4 shadow-lg transition-colors ${
      isDarkMode 
        ? 'bg-gray-800/95 border-gray-600 text-white' 
        : 'bg-white/95 border-gray-300 text-gray-800'
    }`}>
      <h3 className={`text-sm font-semibold mb-3 ${
        isDarkMode ? 'text-gray-200' : 'text-gray-700'
      }`}>Map Settings</h3>
      
      <div className="space-y-3">
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between">
          <label className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Dark Mode</label>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDarkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Label Size */}
        <div>
          <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Label Size: {labelSize}px
          </label>
          <input
            type="range"
            min="8"
            max="20"
            value={labelSize}
            onChange={(e) => setLabelSize(Number(e.target.value))}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
              isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
            }`}
          />
        </div>

        {/* Node Size */}
        <div>
          <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Node Size: {nodeSize}px
          </label>
          <input
            type="range"
            min="3"
            max="12"
            value={nodeSize}
            onChange={(e) => setNodeSize(Number(e.target.value))}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
              isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
            }`}
          />
        </div>

        {/* Stroke Width */}
        <div>
          <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Line Width: {strokeWidth}px
          </label>
          <input
            type="range"
            min="1"
            max="6"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
              isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
            }`}
          />
        </div>
      </div>
    </div>
  );
}; 