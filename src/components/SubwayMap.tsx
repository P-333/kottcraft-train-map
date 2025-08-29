"use client";

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import * as d3 from "d3";
import { DataSet, Station } from "../types/subway";
import { RouteResult } from "../utils/subwayUtils";
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
  route?: RouteResult | null;
  onClearHighlight: () => void;
}

export interface SubwayMapHandle {
  fitRouteToView: (route: RouteResult) => void;
}

export const SubwayMap = forwardRef<SubwayMapHandle, SubwayMapProps>(({ 
  data,
  isDarkMode,
  labelSize,
  nodeSize,
  strokeWidth,
  highlightedStation,
  route,
  onClearHighlight
}, ref) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [viewportCenter, setViewportCenter] = useState({ x: 0, y: 0 });
  const [zoomReady, setZoomReady] = useState(false);
  const pendingFitRef = useRef<RouteResult | null>(null);
  const onClearRef = useRef(onClearHighlight);
  useEffect(() => { onClearRef.current = onClearHighlight; }, [onClearHighlight]);

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

  const fitBounds = (minX: number, minY: number, maxX: number, maxY: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    const rect = svgRef.current.getBoundingClientRect();
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const pad = Math.max(width, height) * 0.2 + 120;
    // Compute zoom k relative to base identity scale (which maps viewBox -> viewport)
    let scale = Math.min(
      extent.width / (width + pad),
      extent.height / (height + pad)
    );
    // Dynamic zoom boost based on route span: short routes zoom in, long routes zoom out slightly
    const span = Math.max(width, height);
    const tZoom = Math.min(1, span / 3000); // 0 for short, 1 for very long
    const boost = 1.35 - 0.45 * tZoom; // 1.35 (short) -> 0.90 (long)
    scale *= boost;
    if (!isFinite(scale) || scale <= 0) scale = 1;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    // Compute dynamic divisors based on span to bias center without over/under-shoot
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const divXMax = 8, divXMin = 3; // small span -> bigger divisor (smaller push)
    const divYMax = 6, divYMin = 2.5;
    const tx = Math.min(1, spanX / 3000);
    const ty = Math.min(1, spanY / 2000);
    const divX = divXMax - tx * (divXMax - divXMin);
    const divY = divYMax - ty * (divYMax - divYMin);
    const baseX = 1700, baseY = 200;
    const offX = baseX + spanX / divX;
    const offY = baseY + spanY / divY;

    const transform = d3.zoomIdentity
      .translate(rect.width / 2, rect.height / 2)
      .scale(Math.max(0.05, Math.min(200, scale)))
      .translate(-(cx + offX + 1000), -(cy + offY + 100));
    svg.transition().duration(700).call(zoomRef.current.transform, transform);
  };

  useImperativeHandle(ref, () => ({
    fitRouteToView: (r: RouteResult) => {
      if (!r || r.steps.length === 0) return;
      if (!svgRef.current || !zoomRef.current || !zoomReady) {
        pendingFitRef.current = r;
        return;
      }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const step of r.steps) {
        const a = stationIndex.get(step.from);
        const b = stationIndex.get(step.to);
        if (a) {
          minX = Math.min(minX, a.x); maxX = Math.max(maxX, a.x);
          minY = Math.min(minY, a.y); maxY = Math.max(maxY, a.y);
        }
        if (b) {
          minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x);
          minY = Math.min(minY, b.y); maxY = Math.max(maxY, b.y);
        }
      }
      if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
        fitBounds(minX, minY, maxX, maxY);
      }
    }
  }));

  // If a fit was requested before zoom was ready, perform it now
  useEffect(() => {
    if (!zoomReady) return;
    if (!pendingFitRef.current) return;
    const r = pendingFitRef.current;
    pendingFitRef.current = null;
    if (!r || r.steps.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const step of r.steps) {
      const a = stationIndex.get(step.from);
      const b = stationIndex.get(step.to);
      if (a) {
        minX = Math.min(minX, a.x); maxX = Math.max(maxX, a.x);
        minY = Math.min(minY, a.y); maxY = Math.max(maxY, a.y);
      }
      if (b) {
        minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x);
        minY = Math.min(minY, b.y); maxY = Math.max(maxY, b.y);
      }
    }
    if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
      fitBounds(minX, minY, maxX, maxY);
    }
  }, [zoomReady]);

  // Note: fitting to route is exposed via imperative handle; not auto-applied

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
        onClearRef.current && onClearRef.current();
      }
    };
    
    window.addEventListener("keydown", onKey);

    return () => {
      svg.on(".zoom", null);
      window.removeEventListener("keydown", onKey);
      setZoomReady(false);
    };
  }, [data]);

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
                  const isInRoute = !!route?.steps.find((s) =>
                    (s.from === edge.from && s.to === edge.to && s.line === edge.line) ||
                    (s.from === edge.to && s.to === edge.from && s.line === edge.line)
                  );
                  
                  return (
                    <path
                      key={`${edge.from}-${edge.to}-${idx}`}
                      d={d}
                      fill="none"
                      stroke={isInRoute ? "#f59e0b" : color}
                      strokeWidth={isInRoute ? strokeWidth + 2 : strokeWidth}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      opacity={route ? (isInRoute ? 1 : 0.25) : 1}
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
            const isOnRoute = !!route?.steps.find((s) => s.from === station.name || s.to === station.name);
            
            return (
              <g key={station.name}>
                <circle
                  cx={station.x}
                  cy={station.y}
                  r={nodeSize + (isHub ? 3 : 2) + (isHighlighted ? 4 : 0) + (isOnRoute ? 2 : 0)}
                  fill={isHighlighted ? "#fbbf24" : (isOnRoute ? "#fde68a" : nodeFillColor)}
                  stroke={isHighlighted ? "#d97706" : (isOnRoute ? "#f59e0b" : nodeStrokeColor)}
                  strokeWidth={isHighlighted ? 3 : (isOnRoute ? 2 : 1)}
                  filter="url(#nodeShadow)"
                />
                <text
                  x={station.x + 8}
                  y={station.y - 8}
                  fontSize={labelSize}
                  fontFamily="Inter, system-ui, sans-serif"
                  fill={isHighlighted ? "#fbbf24" : (isOnRoute ? "#fbbf24" : textColor)}
                  fontWeight={isHighlighted || isOnRoute ? "bold" : "normal"}
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
});

SubwayMap.displayName = "SubwayMap";