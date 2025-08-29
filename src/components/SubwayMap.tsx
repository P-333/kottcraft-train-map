"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { DataSet, Station } from "../types/subway";
import { 
  autoColor, 
  stationLines, 
  indexStations, 
  computeExtent 
} from "../utils/subwayUtils";

interface SubwayMapProps {
  data: DataSet;
  isDarkMode: boolean;
  labelSize: number;
  nodeSize: number;
  strokeWidth: number;
  highlightedStation: Station | null;
  onClearHighlight: () => void;
}

export const SubwayMap: React.FC<SubwayMapProps> = ({
  data,
  isDarkMode,
  labelSize,
  nodeSize,
  strokeWidth,
  highlightedStation,
  onClearHighlight
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [viewportCenter, setViewportCenter] = useState({ x: 0, y: 0 });
  const [zoomReady, setZoomReady] = useState(false);

  const stationIndex = indexStations(data.stations);
  const lines = Array.from(new Set(data.connections.map((c) => c.line))).sort();
  const colorByLine = autoColor(lines);
  const extent = computeExtent(data);

  const goTo = (x: number, y: number, k: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    const svgRect = svgRef.current.getBoundingClientRect();
    const centerX = svgRect.width / 2;
    const centerY = svgRect.height / 2;
    const transform = d3.zoomIdentity
      .translate(centerX, centerY)
      .scale(k)
      .translate(-x - 700, -y - 120);
    svg.transition().duration(800).call(zoomRef.current.transform, transform);
  };

  // D3 zoom setup
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.01, 200])
      .wheelDelta((e: WheelEvent) => -e.deltaY * 0.002)
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (svgRect) {
          const centerX = svgRect.width / 2;
          const centerY = svgRect.height / 2;
          const dataX = ((centerX - event.transform.x) / event.transform.k);
          const dataY = (centerY - event.transform.y) / event.transform.k;
          setViewportCenter({ x: dataX, y: dataY });
        }
      });

    zoomRef.current = zoomBehavior;
    svg.call(zoomBehavior);
    svg.call(zoomBehavior.transform, d3.zoomIdentity);
    setZoomReady(true);

    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "+" || e.key === "=") {
        zoomRef.current && svg.transition().duration(160).call(zoomRef.current.scaleBy, 1.5);
      } else if (e.key === "-" || e.key === "_") {
        zoomRef.current && svg.transition().duration(160).call(zoomRef.current.scaleBy, 1 / 1.5);
      } else if (e.key.toLowerCase() === "0") {
        zoomRef.current && svg.transition().duration(160).call(zoomRef.current.transform, d3.zoomIdentity);
        onClearHighlight();
      }
    };
    
    window.addEventListener("keydown", onKey);

    return () => {
      svg.on(".zoom", null);
      window.removeEventListener("keydown", onKey);
      setZoomReady(false);
    };
  }, [data, onClearHighlight]);

  // Auto-zoom to highlighted station once zoom is ready
  useEffect(() => {
    if (highlightedStation && zoomReady) {
      goTo(highlightedStation.x, highlightedStation.y, 70);
    }
  }, [highlightedStation, zoomReady]);

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(160).call(zoomRef.current.scaleBy, 1.5);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(160).call(zoomRef.current.scaleBy, 1 / 1.5);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(160).call(zoomRef.current.transform, d3.zoomIdentity);
    onClearHighlight();
  };

  const bgColor = isDarkMode ? "#1f2937" : "#ffffff";
  const textColor = isDarkMode ? "#f3f4f6" : "#111827";
  const nodeFillColor = isDarkMode ? "#374151" : "#ffffff";
  const nodeStrokeColor = isDarkMode ? "#6b7280" : "#111827";

  return (
    <div className={`relative w-full h-screen transition-colors duration-200 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={handleZoomOut}
          className={`p-2 border rounded-lg shadow-sm transition-colors ${
            isDarkMode 
              ? 'bg-gray-800/90 hover:bg-gray-700 border-gray-600 text-gray-200' 
              : 'bg-white/90 hover:bg-white border-gray-300 text-gray-700'
          }`}
          title="Zoom Out (-)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={handleZoomIn}
          className={`p-2 border rounded-lg shadow-sm transition-colors ${
            isDarkMode 
              ? 'bg-gray-800/90 hover:bg-gray-700 border-gray-600 text-gray-200' 
              : 'bg-white/90 hover:bg-white border-gray-300 text-gray-700'
          }`}
          title="Zoom In (+)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={handleResetZoom}
          className={`p-2 border rounded-lg shadow-sm transition-colors ${
            isDarkMode 
              ? 'bg-gray-800/90 hover:bg-gray-700 border-gray-600 text-gray-200' 
              : 'bg-white/90 hover:bg-white border-gray-300 text-gray-700'
          }`}
          title="Reset Zoom (0)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Coordinate Display */}
      <div className={`absolute bottom-4 right-4 z-20 px-3 py-2 rounded-lg border shadow-sm transition-colors ${
        isDarkMode 
          ? 'bg-gray-800/90 border-gray-600 text-gray-200' 
          : 'bg-white/90 border-gray-300 text-gray-700'
      }`}>
        <div className="text-sm font-mono">
          <div className="font-semibold text-xs mb-1">Viewport Center</div>
          <div className="text-xs">
            <span className="text-blue-400">X:</span> {viewportCenter.x.toFixed(1)}
          </div>
          <div className="text-xs">
            <span className="text-green-400">Y:</span> {viewportCenter.y.toFixed(1)}
          </div>
          {highlightedStation && (
            <>
              <div className="font-semibold text-xs mb-1 mt-2">Selected Station</div>
              <div className="text-xs">
                <span className="text-blue-400">X:</span> {highlightedStation.x}
              </div>
              <div className="text-xs">
                <span className="text-green-400">Y:</span> {highlightedStation.y}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Map SVG */}
      <svg
        ref={svgRef}
        className="block w-full h-full touch-none cursor-grab active:cursor-grabbing"
        viewBox={`${extent.minX} ${extent.minY} ${extent.width} ${extent.height}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ backgroundColor: bgColor }}
      >
        <defs>
          <filter id="nodeShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
          </filter>
        </defs>
        
        <g ref={gRef}>
          {/* Draw connections/lines */}
          {Array.from(new Set(data.connections.map(c => c.line))).sort().map((line) => {
            const color = colorByLine.get(line)!;
            const edges = data.connections.filter((c) => c.line === line);
            
            return (
              <g key={line}>
                {edges.map((edge, idx) => {
                  const a = stationIndex.get(edge.from);
                  const b = stationIndex.get(edge.to);
                  if (!a || !b) return null;
                  
                  const d = `M${a.x},${a.y} L${b.x},${b.y}`;
                  
                  return (
                    <path
                      key={`${edge.from}-${edge.to}-${idx}`}
                      d={d}
                      fill="none"
                      stroke={color}
                      strokeWidth={strokeWidth}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Draw stations */}
          {data.stations.map((station) => {
            const isHub = stationLines(station.name, data.connections).size > 1;
            const isHighlighted = highlightedStation?.name === station.name;
            
            return (
              <g key={station.name}>
                <circle
                  cx={station.x}
                  cy={station.y}
                  r={nodeSize + (isHub ? 3 : 2) + (isHighlighted ? 4 : 0)}
                  fill={isHighlighted ? "#fbbf24" : nodeFillColor}
                  stroke={isHighlighted ? "#d97706" : nodeStrokeColor}
                  strokeWidth={isHighlighted ? 3 : 1}
                  filter="url(#nodeShadow)"
                />
                <text
                  x={station.x + 8}
                  y={station.y - 8}
                  fontSize={labelSize}
                  fontFamily="Inter, system-ui, sans-serif"
                  fill={isHighlighted ? "#fbbf24" : textColor}
                  fontWeight={isHighlighted ? "bold" : "normal"}
                >
                  {station.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}; 