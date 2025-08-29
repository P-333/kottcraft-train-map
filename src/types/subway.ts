export interface Station {
  name: string;
  x: number;
  y: number;
}

export interface Connection {
  from: string;
  to: string;
  line: string;
}

export interface DataSet {
  stations: Station[];
  connections: Connection[];
}

export interface Extent {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export interface DiagnosticResult {
  name: string;
  pass: boolean;
  info?: string;
} 