// Core types for Energy Dashboard

// WebSocket message format
export interface EnergyReading {
  timestamp: string;
  zoneId: string;
  zoneName: string;
  energyKw: number;
  temperature: number;
  equipmentCount: number;
}

// Zone metadata from config file
export interface ZoneConfig {
  id: string;
  name: string;
  description: string;
  location: string;
  expectedRange: { min: number; max: number };
  operatingHours: string;
  equipmentCount: number;
  averageConsumption: number;
}

// Anomaly detection types
export type AnomalyType = 'spike' | 'drop' | 'flatline';

// Anomaly severity levels
export type AnomalySeverity = 'warning' | 'critical';

// Anomaly detection result
export interface Anomaly {
  id: string; // Unique identifier
  type: AnomalyType;
  zoneId: string;
  zoneName: string;
  timestamp: string;
  value: number; // Actual energy reading
  threshold: number; // Expected threshold that was exceeded
  severity: AnomalySeverity;
}

// WebSocket connection state
export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';