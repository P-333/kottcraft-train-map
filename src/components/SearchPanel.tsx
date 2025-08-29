"use client";

import React, { useState, useMemo } from "react";
import { Station, Connection } from "../types/subway";

interface SearchPanelProps {
  stations: Station[];
  connections: Connection[];
  isDarkMode: boolean;
  onStationSelect: (station: Station) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  stations,
  connections,
  isDarkMode,
  onStationSelect
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredStations = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    return stations
      .filter(station => 
        station.name.toLowerCase().includes(term)
      )
      .map(station => {
        const connectedLines = connections
          .filter(conn => conn.from === station.name || conn.to === station.name)
          .map(conn => conn.line);
        
        return {
          ...station,
          connectedLines: [...new Set(connectedLines)]
        };
      })
      .slice(0, 10); // Limit to 10 results
  }, [searchTerm, stations, connections]);

  const handleStationSelect = (station: Station) => {
    onStationSelect(station);
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-30 transition-all duration-200 ${
      isDarkMode ? 'text-white' : 'text-gray-800'
    }`}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search stations..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={`w-80 px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
              : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
        />
        
        {/* Search Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && filteredStations.length > 0 && (
        <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg border shadow-lg max-h-96 overflow-y-auto ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600' 
            : 'bg-white border-gray-300'
        }`}>
          {filteredStations.map((station) => (
            <button
              key={station.name}
              onClick={() => handleStationSelect(station)}
              className={`w-full text-left px-4 py-3 hover:bg-opacity-80 transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700 border-b border-gray-700' 
                  : 'hover:bg-gray-100 border-b border-gray-200'
              } first:rounded-t-lg last:rounded-b-lg last:border-b-0`}
            >
              <div className="font-medium">{station.name}</div>
              <div className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Connected lines: {station.connectedLines.join(", ")}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}; 