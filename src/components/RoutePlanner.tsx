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
      {!isOpen && (
        <button
          aria-label="Expand route planner"
          onClick={() => setIsOpen(true)}
          className={`fixed right-0 top-1/2 -translate-y-1/2 z-30 w-11 h-32 rounded-l-md border shadow-sm flex items-center justify-center ${
            isDarkMode ? 'bg-gray-800/95 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white/95 border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
          style={{ writingMode: 'vertical-rl' }}
        >
          Route
        </button>
      )}

      <div className="fixed inset-y-0 right-0 z-30 flex items-center pointer-events-none">
        <div
          className={`pointer-events-auto w-[380px] max-w-[92vw] rounded-l-lg border shadow-lg transition-transform duration-200 ${
            isDarkMode ? 'bg-gray-800/95 border-gray-700 text-gray-100' : 'bg-white/95 border-gray-300 text-gray-800'
          }`}
          style={{ transform: `translateX(${isOpen ? '0' : '100%'})` }}
          aria-expanded={isOpen}
        >
        {/* Flap handle when open */}
        {isOpen && (
          <button
            aria-label="Collapse route planner"
            onClick={() => setIsOpen(false)}
            className={`absolute left-[-44px] top-1/2 -translate-y-1/2 w-11 h-32 rounded-l-md border shadow-sm flex items-center justify-center ${
              isDarkMode ? 'bg-gray-800/95 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white/95 border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
            style={{ writingMode: 'vertical-rl' }}
          >
            Route
          </button>
        )}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Route planner</div>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("hops")}
                className={`px-3 py-1 rounded-md border text-sm ${mode === 'hops' ? (isDarkMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-blue-600 border-blue-600 text-white') : (isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-white border-gray-300 text-gray-700')}`}
              >
                Fewest transfers
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
          <LegList isDarkMode={isDarkMode} route={route} />
        )}
        </div>
      </div>
    </>
  );
};

interface LegListProps {
  isDarkMode: boolean;
  route: RouteResult;
}

const LegList: React.FC<LegListProps> = ({ isDarkMode, route }) => {
  const legs = useMemo(() => {
    type Leg = { line: string; stations: string[] };
    const res: Leg[] = [];
    if (!route.steps.length) return res;
    let currentLine = route.steps[0].line;
    let stations: string[] = [route.steps[0].from, route.steps[0].to];
    for (let i = 1; i < route.steps.length; i++) {
      const step = route.steps[i];
      if (step.line === currentLine) {
        if (stations[stations.length - 1] !== step.to) stations.push(step.to);
      } else {
        res.push({ line: currentLine, stations });
        currentLine = step.line;
        const start = stations[stations.length - 1] === step.from ? step.from : step.from;
        stations = [start, step.to];
      }
    }
    res.push({ line: currentLine, stations });
    return res;
  }, [route]);

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggle = (idx: number) => {
    setExpanded(prev => {
      const s = new Set(prev);
      if (s.has(idx)) s.delete(idx); else s.add(idx);
      return s;
    });
  };

  return (
    <div className={`border-t px-4 py-3 text-sm ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="font-semibold mb-2">Route</div>
      {route.steps.length === 0 ? (
        <div className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Start and destination are the same.</div>
      ) : (
        <div className="space-y-2">
          {legs.map((leg, i) => {
            const start = leg.stations[0];
            const end = leg.stations[leg.stations.length - 1];
            const numStops = leg.stations.length - 1;
            const isOpen = expanded.has(i);
            // Transfer info should be shown ABOVE the next leg, not under the previous
            const transferFromPrevAt = i > 0 ? legs[i - 1].stations[legs[i - 1].stations.length - 1] : null;
            const towards = leg.stations.length > 1 ? leg.stations[1] : null;
            return (
              <div key={`${leg.line}-${i}`} className={`rounded-md ${isDarkMode ? 'bg-gray-900/60' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {transferFromPrevAt && (
                  <div className={`px-3 py-2 text-xs border-b ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
                    Transfer at <span className="font-medium">{transferFromPrevAt}</span> to <span className="font-medium">{leg.line}</span>
                    {towards && (
                      <>
                        {" "}towards <span className="font-medium">{towards}</span>
                      </>
                    )}
                  </div>
                )}
                <button
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  onClick={() => toggle(i)}
                >
                  <div className="text-left">
                    <div className="font-medium">{start} → {end}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{leg.line} • {numStops} stop{numStops !== 1 ? 's' : ''}</div>
                  </div>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{isOpen ? 'Hide details' : 'Show details'}</span>
                </button>
                {isOpen && (
                  <div className={`px-3 pb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <ol className="list-decimal list-inside space-y-1">
                      {leg.stations.map((s, j) => (
                        <li key={`${s}-${j}`}>{s}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

