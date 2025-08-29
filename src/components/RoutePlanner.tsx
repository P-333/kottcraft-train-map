"use client";

import React, { useMemo, useState } from "react";
import { Station } from "../types/subway";
import { RouteResult, RouteMode } from "../utils/subwayUtils";

interface RoutePlannerProps {
  stations: Station[];
  isDarkMode: boolean;
  route: RouteResult | null;
  onPlan: (start: string, end: string, mode: RouteMode) => void;
  onClear: () => void;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  stations,
  isDarkMode,
  route,
  onPlan,
  onClear
}) => {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<RouteMode>("hops");

  const stationNames = useMemo(() => stations.map(s => s.name).sort(), [stations]);

  const canPlan = start.trim().length > 0 && end.trim().length > 0 && start.trim() !== end.trim();

  return (
    <>
      <button
        aria-label={isOpen ? "Hide route planner" : "Show route planner"}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-4 top-1/2 -translate-y-1/2 z-30 px-3 py-2 rounded-md border shadow-sm font-medium transition-colors ${
          isDarkMode
            ? 'bg-gray-800/90 hover:bg-gray-700 border-gray-600 text-gray-200'
            : 'bg-white/90 hover:bg-white border-gray-300 text-gray-700'
        }`}
      >
        {isOpen ? 'Close' : 'Route'}
      </button>

      <div className={`fixed top-1/2 right-4 -translate-y-1/2 z-30 w-[380px] max-w-[92vw] rounded-lg border shadow-lg transition-all duration-200 ${
        isDarkMode ? 'bg-gray-800/95 border-gray-700 text-gray-100' : 'bg-white/95 border-gray-300 text-gray-800'
      } ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0 pointer-events-none'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Route planner</div>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("hops")}
                className={`px-3 py-1 rounded-md border text-sm ${mode === 'hops' ? (isDarkMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-blue-600 border-blue-600 text-white') : (isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-white border-gray-300 text-gray-700')}`}
              >
                Fewest stops
              </button>
              <button
                onClick={() => setMode("distance")}
                className={`px-3 py-1 rounded-md border text-sm ${mode === 'distance' ? (isDarkMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-blue-600 border-blue-600 text-white') : (isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-white border-gray-300 text-gray-700')}`}
              >
                Shortest distance
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-3">
            <div>
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>From</label>
              <input
                list="route-stations"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="Start station"
                className={`w-full px-3 py-2 rounded-md border transition-colors ${
                  isDarkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>To</label>
              <input
                list="route-stations"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                placeholder="Destination station"
                className={`w-full px-3 py-2 rounded-md border transition-colors ${
                  isDarkMode ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => { setStart(""); setEnd(""); onClear(); }}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Clear
            </button>
            <button
              onClick={() => canPlan && onPlan(start.trim(), end.trim(), mode)}
              disabled={!canPlan}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                canPlan
                  ? (isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white')
                  : (isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500')
              }`}
            >
              Plan Route
            </button>
          </div>

          <datalist id="route-stations">
            {stationNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>

        {route && (
          <div className={`border-t px-4 py-3 text-sm ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="font-semibold mb-2">Route Steps</div>
            {route.steps.length === 0 ? (
              <div className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Start and destination are the same.</div>
            ) : (
              <ol className="list-decimal list-inside space-y-1">
                {route.steps.map((s, i) => (
                  <li key={`${s.from}-${s.to}-${i}`}>
                    {s.from} → {s.to} <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>({s.line})</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </>
  );
};

