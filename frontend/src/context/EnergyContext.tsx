import { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { EnergyReading, Anomaly, ConnectionStatus } from '../types';
import { useWebSocket } from '../hooks/useWebSocket';
import { detectAnomaly } from '../utils/anomalyDetection';

const MAX_READINGS_PER_ZONE = 1500; // Keep last 1500 points (supports 1000-point chart with buffer)
const MAX_ANOMALIES = 50; // Keep last 50 anomalies

interface EnergyContextType {
  latestReadings: Map<string, EnergyReading>;
  readings: Map<string, EnergyReading[]>;
  anomalies: Anomaly[];
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;
}

const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

export function EnergyProvider({ children }: { children: ReactNode }) {
  const [latestReadings, setLatestReadings] = useState(new Map<string, EnergyReading>());
  const [readings, setReadings] = useState(new Map<string, EnergyReading[]>());
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  
  // Track previous readings for pattern-based detection
  const previousReadingsRef = useRef(new Map<string, EnergyReading>());

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((reading: EnergyReading) => {
    // Get previous reading for this zone
    const previousReading = previousReadingsRef.current.get(reading.zoneId);
    
    // Detect anomalies using hybrid approach
    const anomaly = detectAnomaly(reading, previousReading);
    if (anomaly) {
      setAnomalies(prev => {
        // Add new anomaly and keep last MAX_ANOMALIES
        const updated = [...prev, anomaly];
        return updated.slice(-MAX_ANOMALIES);
      });
    }
    
    // Update previous reading reference
    previousReadingsRef.current.set(reading.zoneId, reading);
    
    // Update latest reading
    setLatestReadings(prev => new Map(prev).set(reading.zoneId, reading));

    // Update readings history with windowing
    setReadings(prev => {
      const updated = new Map(prev);
      const zoneReadings = updated.get(reading.zoneId) || [];
      const newReadings = [...zoneReadings, reading];
      
      // Keep only last MAX_READINGS_PER_ZONE points
      if (newReadings.length > MAX_READINGS_PER_ZONE) {
        newReadings.shift();
      }
      
      updated.set(reading.zoneId, newReadings);
      return updated;
    });
  }, []);

  const { status, attempts } = useWebSocket(handleMessage);

  const value: EnergyContextType = {
    latestReadings,
    readings,
    anomalies,
    connectionStatus: status,
    reconnectAttempts: attempts,
  };

  return <EnergyContext.Provider value={value}>{children}</EnergyContext.Provider>;
}

// Custom hook to use energy context
export function useEnergy() {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error('useEnergy must be used within EnergyProvider');
  }
  return context;
}