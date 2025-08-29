import * as XLSX from "xlsx";
import { Station, Connection, DataSet } from "../types/subway";
import { normalizeHeader } from "./subwayUtils";

interface ExcelRow {
  [key: string]: string | number | null;
}

export async function loadSubwayDataFromFile(filePath: string): Promise<DataSet> {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const dataBuf = new Uint8Array(arrayBuffer);
    const wb = XLSX.read(dataBuf, { type: "array" });
    
    const stationsSheet = wb.Sheets["Stations"] || wb.Sheets[wb.SheetNames[0]];
    const connectionsSheet = wb.Sheets["Connections"] || wb.Sheets[wb.SheetNames[1]];
    
    if (!stationsSheet || !connectionsSheet) {
      throw new Error("Excel file must contain 'Stations' and 'Connections' sheets");
    }
    
    const rawStations: ExcelRow[] = XLSX.utils.sheet_to_json(stationsSheet, { defval: null });
    const rawConnections: ExcelRow[] = XLSX.utils.sheet_to_json(connectionsSheet, { defval: null });
    
    const stations = mapStationRows(rawStations);
    const connections = mapConnectionRows(rawConnections);
    
    if (!stations.length || !connections.length) {
      throw new Error("Could not parse stations and connections data");
    }
    
    return { stations, connections };
  } catch (error) {
    console.error("Error loading Excel data:", error);
    // Return empty dataset on error
    return { stations: [], connections: [] };
  }
}

function mapStationRows(rawStations: ExcelRow[]): Station[] {
  return rawStations
    .map((row) => {
      const keys = Object.keys(row);
      const headerMap: Record<string, string> = {};
      keys.forEach(k => headerMap[normalizeHeader(k)] = k);
      
      const nameKey = headerMap["name of the station"] || headerMap["station"] || headerMap["name"];
      const xKey = headerMap["x coordinate"] || headerMap["x"];
      const yKey = headerMap["y coordinate"] || headerMap["z coordinate"] || headerMap["y"] || headerMap["z"];
      
      if (!nameKey || xKey == null || yKey == null) return null;
      
      const name = String(row[nameKey]).trim();
      const x = Number(row[xKey]);
      const y = Number(row[yKey]);
      
      if (!name || !isFinite(x) || !isFinite(y)) return null;
      
      return { name, x, y };
    })
    .filter(Boolean) as Station[];
}

function mapConnectionRows(rawConnections: ExcelRow[]): Connection[] {
  return rawConnections
    .map((row) => {
      const keys = Object.keys(row);
      const headerMap: Record<string, string> = {};
      keys.forEach(k => headerMap[normalizeHeader(k)] = k);
      
      const fromKey = headerMap["from"] || headerMap["source"] || headerMap["start"];
      const toKey = headerMap["towards"] || headerMap["to"] || headerMap["target"];
      const lineKey = headerMap["line"] || headerMap["route"];
      
      if (!fromKey || !toKey || !lineKey) return null;
      
      const from = String(row[fromKey]).trim();
      const to = String(row[toKey]).trim();
      const line = String(row[lineKey]).trim();
      
      if (!from || !to || !line) return null;
      
      return { from, to, line };
    })
    .filter(Boolean) as Connection[];
} 