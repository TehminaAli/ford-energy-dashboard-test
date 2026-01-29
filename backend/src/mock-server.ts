/**
 * Mock WebSocket Server for Ford Energy Dashboard Technical Test
 *
 * This server simulates real-time energy sensor data from 5 manufacturing zones.
 * It broadcasts data every 100ms, rotating through zones.
 *
 * Features:
 * - Realistic energy consumption patterns per zone
 * - Time-of-day variations (higher usage during operating hours)
 * - Random noise (±5-10% variation)
 * - Anomaly injection (5% chance): spikes, drops, flat-lines
 * - Handles client connections/disconnections gracefully
 *
 * Usage:
 *   npm run dev     # Run with ts-node (development)
 *   npm run build && npm start  # Build and run compiled JS
 */

import WebSocket, { WebSocketServer } from "ws";
import seedrandom from "seedrandom";

// ============================================================================
// Types
// ============================================================================

interface ZoneConfig {
  id: string;
  name: string;
  description: string;
  location: string;
  expectedRange: {
    min: number;
    max: number;
  };
  criticalThreshold: number;
  equipmentCount: number;
  operatingHours: {
    type: "24/7" | "scheduled";
    start: number | null;
    end: number | null;
  };
  priority: "critical" | "high" | "medium" | "low";
  costPerKwh: number;
  baselineTemperature: number;
}

interface SensorReading {
  timestamp: string;
  zoneId: string;
  zoneName: string;
  energyKw: number;
  temperature: number;
  equipmentCount: number;
}

type AnomalyType = "spike" | "drop" | "flatline" | null;

// ============================================================================
// Configuration
// ============================================================================

const PORT = 8080;
const BROADCAST_INTERVAL_MS = 100;
const ANOMALY_CHANCE = 0.05; // 5% chance of anomaly
const FLATLINE_DURATION_MS = 30000; // 30 seconds

// Zone configurations loaded inline (matches data/zones-config.json)
const ZONES: ZoneConfig[] = [
  {
    id: "assembly-1",
    name: "Assembly Line 1",
    description: "Primary vehicle assembly line",
    location: "Building A, Level 1",
    expectedRange: { min: 220, max: 280 },
    criticalThreshold: 350,
    equipmentCount: 12,
    operatingHours: { type: "24/7", start: null, end: null },
    priority: "critical",
    costPerKwh: 0.12,
    baselineTemperature: 22.0,
  },
  {
    id: "paint-shop",
    name: "Paint Shop",
    description: "Automated painting facility",
    location: "Building B, Level 1",
    expectedRange: { min: 150, max: 200 },
    criticalThreshold: 280,
    equipmentCount: 8,
    operatingHours: { type: "scheduled", start: 6, end: 22 },
    priority: "high",
    costPerKwh: 0.14,
    baselineTemperature: 24.0,
  },
  {
    id: "stamping-press",
    name: "Stamping Press",
    description: "Heavy-duty hydraulic stamping presses",
    location: "Building C, Level 1",
    expectedRange: { min: 300, max: 400 },
    criticalThreshold: 500,
    equipmentCount: 6,
    operatingHours: { type: "24/7", start: null, end: null },
    priority: "critical",
    costPerKwh: 0.11,
    baselineTemperature: 26.0,
  },
  {
    id: "quality-control",
    name: "Quality Control",
    description: "Inspection stations",
    location: "Building A, Level 2",
    expectedRange: { min: 50, max: 80 },
    criticalThreshold: 120,
    equipmentCount: 15,
    operatingHours: { type: "scheduled", start: 7, end: 19 },
    priority: "medium",
    costPerKwh: 0.13,
    baselineTemperature: 20.0,
  },
  {
    id: "warehouse",
    name: "Warehouse",
    description: "Parts storage and logistics",
    location: "Building D, Level 1",
    expectedRange: { min: 20, max: 40 },
    criticalThreshold: 60,
    equipmentCount: 4,
    operatingHours: { type: "24/7", start: null, end: null },
    priority: "low",
    costPerKwh: 0.1,
    baselineTemperature: 18.0,
  },
];

// ============================================================================
// State
// ============================================================================

let currentZoneIndex = 0;
let rng = seedrandom(Date.now().toString());

// Flatline state per zone
const flatlineState: Map<
  string,
  { active: boolean; value: number; startTime: number }
> = new Map();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a zone is currently operating based on its schedule
 */
function isZoneOperating(zone: ZoneConfig, hour: number): boolean {
  if (zone.operatingHours.type === "24/7") {
    return true;
  }

  const start = zone.operatingHours.start!;
  const end = zone.operatingHours.end!;

  return hour >= start && hour < end;
}

/**
 * Calculate time-of-day factor (higher during business hours)
 * Returns a multiplier between 0.6 and 1.2
 */
function getTimeOfDayFactor(hour: number): number {
  // Peak hours: 8am - 6pm
  if (hour >= 8 && hour < 18) {
    return 1.0 + 0.2 * Math.sin(((hour - 8) / 10) * Math.PI);
  }
  // Off-peak: lower consumption
  return 0.6 + 0.2 * Math.sin(((hour + 6) / 12) * Math.PI);
}

/**
 * Generate a random value with noise
 */
function addNoise(value: number, noisePercent: number = 0.1): number {
  const noise = (rng() - 0.5) * 2 * noisePercent * value;
  return value + noise;
}

/**
 * Determine if an anomaly should occur and what type
 */
function determineAnomaly(): AnomalyType {
  if (rng() < ANOMALY_CHANCE) {
    const anomalyRoll = rng();
    if (anomalyRoll < 0.4) return "spike";
    if (anomalyRoll < 0.8) return "drop";
    return "flatline";
  }
  return null;
}

/**
 * Generate energy reading for a zone
 */
function generateEnergyReading(zone: ZoneConfig, now: Date): number {
  const hour = now.getHours();
  const isOperating = isZoneOperating(zone, hour);

  // Base energy within expected range
  const baseEnergy =
    zone.expectedRange.min +
    rng() * (zone.expectedRange.max - zone.expectedRange.min);

  // Apply time-of-day factor
  let energy = baseEnergy * getTimeOfDayFactor(hour);

  // If not operating, reduce to ~10-20% of normal
  if (!isOperating) {
    energy = baseEnergy * (0.1 + rng() * 0.1);
  }

  // Add spiky pattern for stamping press (simulates press cycles)
  if (zone.id === "stamping-press" && isOperating) {
    const cyclePhase = (now.getSeconds() % 10) / 10;
    if (cyclePhase < 0.3) {
      energy *= 1.3; // Press down - high energy
    }
  }

  // Check for flatline state
  const flatline = flatlineState.get(zone.id);
  if (flatline?.active) {
    if (Date.now() - flatline.startTime > FLATLINE_DURATION_MS) {
      flatlineState.set(zone.id, { active: false, value: 0, startTime: 0 });
    } else {
      return flatline.value;
    }
  }

  // Check for anomalies
  const anomaly = determineAnomaly();
  if (anomaly === "spike") {
    energy *= 2.0;
    console.log(
      `⚠️  ANOMALY [${zone.name}]: Spike detected - ${energy.toFixed(1)} kW`,
    );
  } else if (anomaly === "drop") {
    energy *= 0.5;
    console.log(
      `⚠️  ANOMALY [${zone.name}]: Drop detected - ${energy.toFixed(1)} kW`,
    );
  } else if (anomaly === "flatline") {
    flatlineState.set(zone.id, {
      active: true,
      value: energy,
      startTime: Date.now(),
    });
    console.log(
      `⚠️  ANOMALY [${zone.name}]: Flatline started - ${energy.toFixed(1)} kW`,
    );
  }

  // Add random noise (±5-10%)
  return Math.max(0, addNoise(energy, 0.05 + rng() * 0.05));
}

/**
 * Generate temperature reading for a zone
 */
function generateTemperature(zone: ZoneConfig, energyKw: number): number {
  // Temperature correlates with energy usage
  const energyRatio =
    energyKw / ((zone.expectedRange.min + zone.expectedRange.max) / 2);
  const tempVariation = (energyRatio - 1) * 3; // ±3°C based on energy
  return addNoise(zone.baselineTemperature + tempVariation, 0.02);
}

/**
 * Generate a complete sensor reading
 */
function generateSensorReading(zone: ZoneConfig): SensorReading {
  const now = new Date();
  const energyKw = generateEnergyReading(zone, now);
  const temperature = generateTemperature(zone, energyKw);

  return {
    timestamp: now.toISOString(),
    zoneId: zone.id,
    zoneName: zone.name,
    energyKw: Math.round(energyKw * 10) / 10,
    temperature: Math.round(temperature * 10) / 10,
    equipmentCount: zone.equipmentCount,
  };
}

// ============================================================================
// WebSocket Server
// ============================================================================

const wss = new WebSocketServer({ port: PORT });

console.log(`
╔════════════════════════════════════════════════════════════════╗
║     Ford Energy Dashboard - Mock WebSocket Server              ║
╠════════════════════════════════════════════════════════════════╣
║  Status: Running                                               ║
║  Port: ${PORT}                                                    ║
║  URL: ws://localhost:${PORT}                                      ║
║  Broadcast interval: ${BROADCAST_INTERVAL_MS}ms                                    ║
╠════════════════════════════════════════════════════════════════╣
║  Zones:                                                        ║
║    • Assembly Line 1 (220-280 kW, 24/7)                        ║
║    • Paint Shop (150-200 kW, 6am-10pm)                         ║
║    • Stamping Press (300-400 kW, 24/7, spiky)                  ║
║    • Quality Control (50-80 kW, 7am-7pm)                       ║
║    • Warehouse (20-40 kW, 24/7)                                ║
╠════════════════════════════════════════════════════════════════╣
║  Press Ctrl+C to stop                                          ║
╚════════════════════════════════════════════════════════════════╝
`);

// Track connected clients
let clientCount = 0;

wss.on("connection", (ws: WebSocket) => {
  clientCount++;
  console.log(`✅ Client connected (total: ${clientCount})`);

  ws.on("close", () => {
    clientCount--;
    console.log(`❌ Client disconnected (total: ${clientCount})`);
  });

  ws.on("error", (error: Error) => {
    console.error(`⚠️  WebSocket error: ${error.message}`);
  });
});

// Broadcast data to all connected clients
function broadcast(data: SensorReading): void {
  const message = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Main broadcast loop
setInterval(() => {
  if (wss.clients.size === 0) {
    return; // No clients connected, skip broadcast
  }

  const zone = ZONES[currentZoneIndex];
  const reading = generateSensorReading(zone);

  broadcast(reading);

  // Log every 10th reading to avoid spam
  if (Math.random() < 0.1) {
    console.log(
      `📊 [${reading.timestamp.slice(11, 19)}] ${reading.zoneName}: ${reading.energyKw} kW, ${reading.temperature}°C`,
    );
  }

  // Rotate to next zone
  currentZoneIndex = (currentZoneIndex + 1) % ZONES.length;
}, BROADCAST_INTERVAL_MS);

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n🛑 Shutting down server...");
  wss.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  wss.close(() => {
    process.exit(0);
  });
});
