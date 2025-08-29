"use client";

import React, { useEffect, useState, useRef } from "react";
import { DataSet, DiagnosticResult, Station } from "../types/subway";
import { runDiagnostics, getQueryFlag, findRoute, RouteResult, RouteMode } from "../utils/subwayUtils";
import { loadSubwayDataFromFile } from "../utils/excelLoader";
import { SubwayMap, SubwayMapHandle } from "./SubwayMap";
import { SettingsPanel } from "./SettingsPanel";
import { SearchPanel } from "./SearchPanel";
import { RoutePlanner } from "./RoutePlanner";

export const KottcraftSubwayApp: React.FC = () => {
  const [data, setData] = useState<DataSet>({ stations: [], connections: [] });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [labelSize, setLabelSize] = useState(12);
  const [nodeSize, setNodeSize] = useState(6);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedStation, setHighlightedStation] = useState<Station | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const mapRef = useRef<SubwayMapHandle | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const excelData = await loadSubwayDataFromFile("/subway_data.xlsx");
        if (excelData.stations.length === 0 && excelData.connections.length === 0) {
          setError("No subway data found. Please ensure 'subway_data.xlsx' exists in the public folder with 'Stations' and 'Connections' sheets.");
        } else {
          setData(excelData);

          // Resolve initial focus station from URL (?station=...) or fall back to Centralplan
          const params = new URLSearchParams(window.location.search);
          const stationParam = params.get("station");
          let initial: Station | undefined;
          if (stationParam) {
            const targetName = stationParam.toLowerCase();
            initial = excelData.stations.find(s => s.name.toLowerCase() === targetName)
              || excelData.stations.find(s => s.name.toLowerCase().includes(targetName));
          }
          if (!initial) {
            initial = excelData.stations.find(s => s.name.toLowerCase().includes("centralplan"));
          }
          if (initial) setHighlightedStation(initial);
        }
      } catch (err) {
        setError(`Failed to load subway data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const results = runDiagnostics();
    setDiagnostics(results);
    if (results.some(r => !r.pass)) {
      console.error("Diagnostics failed:", results);
    } else {
      console.info("Diagnostics OK:", results);
    }
  }, [data]);

  const debug = getQueryFlag("debug");
  const showOverlay = data.stations.length === 0 && !isLoading;

  const handleStationSelect = (station: Station) => {
    console.log('Station selected in main app:', station.name);
    setHighlightedStation(station);
    setRoute(null);
    const url = new URL(window.location.href);
    url.searchParams.set('station', station.name);
    // Ensure any legacy params are removed
    url.searchParams.delete('x');
    url.searchParams.delete('y');
    url.searchParams.delete('z');
    window.history.pushState({}, '', url.toString());
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading subway data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'
      }`}>
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <p className="mb-4">{error}</p>
          <div className={`rounded-lg p-4 text-left text-sm ${
            isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'
          }`}>
            <h3 className="font-semibold mb-2">Required Excel Structure:</h3>
            <ul className="space-y-1">
              <li><strong>Stations</strong> sheet: Name, X, Y columns</li>
              <li><strong>Connections</strong> sheet: From, To, Line columns</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'
    }`}>
      {debug && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-30 rounded-lg px-3 py-2 text-sm ${
          isDarkMode 
            ? 'bg-yellow-900/80 border border-yellow-700 text-yellow-200' 
            : 'bg-yellow-100 border border-yellow-300 text-yellow-800'
        }`}>
          <span className="font-semibold">Diagnostics:</span>{" "}
          {diagnostics.filter(d => d.pass).length}/{diagnostics.length} tests passed
        </div>
      )}

      <SearchPanel
        stations={data.stations}
        connections={data.connections}
        isDarkMode={isDarkMode}
        onStationSelect={handleStationSelect}
      />

      <RoutePlanner
        stations={data.stations}
        isDarkMode={isDarkMode}
        route={route}
        onPlan={(start: string, end: string, mode: RouteMode) => {
          const r = findRoute(start, end, data.connections, data.stations, mode);
          setRoute(r);
          if (r) {
            // Optionally fit route into view without resetting to a single station
            mapRef.current?.fitRouteToView(r);
          }
        }}
        onClear={() => {
          setRoute(null);
        }}
      />

      <SettingsPanel
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        labelSize={labelSize}
        setLabelSize={setLabelSize}
        nodeSize={nodeSize}
        setNodeSize={setNodeSize}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
      />

      <SubwayMap
        ref={mapRef}
        data={data}
        isDarkMode={isDarkMode}
        labelSize={labelSize}
        nodeSize={nodeSize}
        strokeWidth={strokeWidth}
        highlightedStation={highlightedStation}
        route={route}
        onClearHighlight={() => {
          setHighlightedStation(null);
          setRoute(null);
          const url = new URL(window.location.href);
          url.searchParams.delete('station');
          url.searchParams.delete('x');
          url.searchParams.delete('y');
          url.searchParams.delete('z');
          window.history.pushState({}, '', url.toString());
        }}
      />

      {showOverlay && (
        <div className="pointer-events-none fixed inset-0 z-10 grid place-items-center bg-white/85 dark:bg-gray-900/85">
          <div className={`pointer-events-auto rounded-2xl border p-6 shadow-sm text-center max-w-md transition-colors duration-200 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-800'
          }`}>
            <h2 className="text-xl font-semibold mb-2">No Subway Data</h2>
            <p className="mb-4">
              Please ensure <span className="font-medium">subway_data.xlsx</span> exists in the public folder with the required sheets.
            </p>
            <div className={`rounded-lg p-4 text-left text-sm ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300' 
                : 'bg-blue-50 text-blue-800'
            }`}>
              <h3 className="font-semibold mb-2">Required Structure:</h3>
              <ul className="space-y-1">
                <li><strong>Stations</strong> sheet: Name, X, Y columns</li>
                <li><strong>Connections</strong> sheet: From, To, Line columns</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 