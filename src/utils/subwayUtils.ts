import * as d3 from "d3";
import { Station, Connection, DataSet, Extent, DiagnosticResult } from "../types/subway";

export function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().replace(/\s+/g, " ");
}

export function autoColor(lines: string[]): Map<string, string> {
  const palette = (d3.schemeTableau10 as readonly string[]).concat(
    d3.schemeSet3 as readonly string[]
  );
  const m = new Map<string, string>();
  lines.forEach((ln, i) => m.set(ln, palette[i % palette.length]));
  return m;
}

export function stationLines(station: string, connections: Connection[]): Set<string> {
  const s = new Set<string>();
  for (const c of connections) {
    if (c.from === station || c.to === station) s.add(c.line);
  }
  return s;
}

export function routeOctolinear(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const ang = Math.atan2(dy, dx);
  const snap = Math.round(ang / (Math.PI / 4)) * (Math.PI / 4);
  const ux = Math.cos(snap);
  const uy = Math.sin(snap);
  const projLen = dx * ux + dy * uy;
  const mid = { x: a.x + projLen * ux, y: a.y + projLen * uy };
  return [a, mid, b];
}

export function indexStations(stations: Station[]): Map<string, Station> {
  const map = new Map<string, Station>();
  stations.forEach((s) => map.set(s.name, s));
  return map;
}

export function computeExtent(data: DataSet): Extent {
  const xs = data.stations.map((s) => s.x);
  const ys = data.stations.map((s) => s.y);
  if (!xs.length || !ys.length) {
    return { minX: -800, minY: -600, width: 1600, height: 1200 };
  }
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const padX = (maxX - minX) * 0.1 + 200;
  const padY = (maxY - minY) * 0.1 + 200;
  const width = (maxX - minX) + 2 * padX;
  const height = (maxY - minY) + 2 * padY;
  if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
    return { minX: -800, minY: -600, width: 1600, height: 1200 };
  }
  return { minX: minX - padX, minY: minY - padY, width, height };
}

export function getQueryFlag(name: string): boolean {
  if (typeof window === "undefined") return false;
  const p = new URLSearchParams(window.location.search);
  return p.get(name) === "1" || p.get(name) === "true";
}

export function runDiagnostics(): DiagnosticResult[] {
  const results: DiagnosticResult[] = [];
  
  // normalizeHeader
  results.push({ 
    name: "normalizeHeader basic", 
    pass: normalizeHeader(" X  Coordinate ") === "x coordinate" 
  });
  results.push({ 
    name: "normalizeHeader trims", 
    pass: normalizeHeader("  Name  ") === "name" 
  });
  
  // routeOctolinear
  const pts = routeOctolinear({ x: 0, y: 0 }, { x: 100, y: 0 });
  results.push({ 
    name: "routeOctolinear 3 points", 
    pass: Array.isArray(pts) && pts.length === 3 
  });
  results.push({ 
    name: "routeOctolinear ends preserved", 
    pass: pts[0].x === 0 && pts[2].x === 100 
  });
  
  // computeExtent
  const e = computeExtent({ stations: [], connections: [] });
  results.push({ 
    name: "computeExtent fallback", 
    pass: e.width === 1600 && e.height === 1200 
  });
  
  // autoColor
  const colors = autoColor(["A", "B", "C"]);
  results.push({ 
    name: "autoColor size", 
    pass: colors.size === 3 
  });
  
  // stationLines
  const sl = stationLines("A", [
    { from: "A", to: "B", line: "Red" }, 
    { from: "C", to: "A", line: "Blue" }
  ]);
  results.push({ 
    name: "stationLines collects", 
    pass: sl.has("Red") && sl.has("Blue") && sl.size === 2 
  });
  
  return results;
} 