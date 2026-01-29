/**
 * Historical Data Generator for Ford Energy Dashboard Technical Test
 *
 * Generates 7 days of historical sensor readings with:
 * - 5-second intervals for all 5 zones
 * - ~120,000 total records
 * - Realistic daily patterns (weekday vs weekend)
 * - Embedded anomalies at specific timestamps
 * - Data gaps to simulate sensor failures
 *
 * Date range: 12-18 January 2026 (fixed for reproducibility)
 *
 * Usage:
 *   npm run generate-data
 *
 * Output:
 *   ../data/historical-data.json
 */

import * as fs from "fs";
import * as path from "path";
import seedrandom from "seedrandom";

// ============================================================================
// Types
// ============================================================================

interface ZoneConfig {
  id: string;
  name: string;
  expectedRange: {
    min: number;
    max: number;
  };
  equipmentCount: number;
  operatingHours: {
    type: "24/7" | "scheduled";
    start: number | null;
    end: number | null;
  };
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

interface Anomaly {
  zoneId: string;
  type: "spike" | "drop" | "flatline" | "overnight" | "decline";
  startTime: Date;
  endTime: Date;
  description: string;
}

interface DataGap {
  zoneId: string;
  startTime: Date;
  endTime: Date;
}

// ============================================================================
// Configuration
// ============================================================================

// Fixed seed for reproducibility
const SEED = "ford-energy-dashboard-2026";
const rng = seedrandom(SEED);

// Date range: 12-18 January 2026 (7 days)
const START_DATE = new Date("2026-01-12T00:00:00.000Z");
const END_DATE = new Date("2026-01-19T00:00:00.000Z");

// Interval between readings
const INTERVAL_SECONDS = 5;

// Zone configurations
const ZONES: ZoneConfig[] = [
  {
    id: "assembly-1",
    name: "Assembly Line 1",
    expectedRange: { min: 220, max: 280 },
    equipmentCount: 12,
    operatingHours: { type: "24/7", start: null, end: null },
    baselineTemperature: 22.0,
  },
  {
    id: "paint-shop",
    name: "Paint Shop",
    expectedRange: { min: 150, max: 200 },
    equipmentCount: 8,
    operatingHours: { type: "scheduled", start: 6, end: 22 },
    baselineTemperature: 24.0,
  },
  {
    id: "stamping-press",
    name: "Stamping Press",
    expectedRange: { min: 300, max: 400 },
    equipmentCount: 6,
    operatingHours: { type: "24/7", start: null, end: null },
    baselineTemperature: 26.0,
  },
  {
    id: "quality-control",
    name: "Quality Control",
    expectedRange: { min: 50, max: 80 },
    equipmentCount: 15,
    operatingHours: { type: "scheduled", start: 7, end: 19 },
    baselineTemperature: 20.0,
  },
  {
    id: "warehouse",
    name: "Warehouse",
    expectedRange: { min: 20, max: 40 },
    equipmentCount: 4,
    operatingHours: { type: "24/7", start: null, end: null },
    baselineTemperature: 18.0,
  },
];

// ============================================================================
// Anomalies (embedded at specific times)
// ============================================================================

/**
 * Anomalies to include (as per spec):
 * - Assembly Line 1: Major spike on day 3 (14 Jan) at 2pm - equipment malfunction
 * - Paint Shop: Unexpected overnight usage on day 5 (16 Jan) - should be off
 * - Stamping Press: Gradual decline on day 6 (17 Jan) - maintenance mode
 * - Quality Control: Flat-line for 30 mins on day 2 (13 Jan) at 10am - sensor failure
 * - Warehouse: Normal (no anomalies - control zone)
 */
const ANOMALIES: Anomaly[] = [
  {
    zoneId: "assembly-1",
    type: "spike",
    startTime: new Date("2026-01-14T14:00:00.000Z"),
    endTime: new Date("2026-01-14T14:15:00.000Z"),
    description: "Equipment malfunction causing 2x energy spike",
  },
  {
    zoneId: "paint-shop",
    type: "overnight",
    startTime: new Date("2026-01-16T23:00:00.000Z"),
    endTime: new Date("2026-01-17T04:00:00.000Z"),
    description: "Unexpected overnight operation (should be off 10pm-6am)",
  },
  {
    zoneId: "stamping-press",
    type: "decline",
    startTime: new Date("2026-01-17T06:00:00.000Z"),
    endTime: new Date("2026-01-17T18:00:00.000Z"),
    description: "Gradual power decline during maintenance mode",
  },
  {
    zoneId: "quality-control",
    type: "flatline",
    startTime: new Date("2026-01-13T10:00:00.000Z"),
    endTime: new Date("2026-01-13T10:30:00.000Z"),
    description: "Sensor failure - readings frozen",
  },
];

// ============================================================================
// Data Gaps (missing data periods)
// ============================================================================

const DATA_GAPS: DataGap[] = [
  {
    zoneId: "assembly-1",
    startTime: new Date("2026-01-15T03:15:00.000Z"),
    endTime: new Date("2026-01-15T03:25:00.000Z"), // 10 minute gap
  },
  {
    zoneId: "paint-shop",
    startTime: new Date("2026-01-13T18:30:00.000Z"),
    endTime: new Date("2026-01-13T18:35:00.000Z"), // 5 minute gap
  },
  {
    zoneId: "stamping-press",
    startTime: new Date("2026-01-16T12:00:00.000Z"),
    endTime: new Date("2026-01-16T12:08:00.000Z"), // 8 minute gap
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if timestamp falls within a data gap
 */
function isInDataGap(zoneId: string, timestamp: Date): boolean {
  return DATA_GAPS.some(
    (gap) =>
      gap.zoneId === zoneId &&
      timestamp >= gap.startTime &&
      timestamp < gap.endTime,
  );
}

/**
 * Get active anomaly for a zone at a specific time
 */
function getActiveAnomaly(zoneId: string, timestamp: Date): Anomaly | null {
  return (
    ANOMALIES.find(
      (a) =>
        a.zoneId === zoneId &&
        timestamp >= a.startTime &&
        timestamp < a.endTime,
    ) || null
  );
}

/**
 * Check if zone is operating at given time
 */
function isZoneOperating(zone: ZoneConfig, timestamp: Date): boolean {
  if (zone.operatingHours.type === "24/7") {
    return true;
  }

  const hour = timestamp.getUTCHours();
  const start = zone.operatingHours.start!;
  const end = zone.operatingHours.end!;

  return hour >= start && hour < end;
}

/**
 * Check if date is a weekend
 */
function isWeekend(timestamp: Date): boolean {
  const day = timestamp.getUTCDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Get time-of-day factor (business hours have higher usage)
 */
function getTimeOfDayFactor(hour: number): number {
  if (hour >= 8 && hour < 18) {
    return 1.0 + 0.2 * Math.sin(((hour - 8) / 10) * Math.PI);
  }
  return 0.7 + 0.15 * Math.sin(((hour + 6) / 12) * Math.PI);
}

/**
 * Add controlled noise to a value
 */
function addNoise(value: number, noisePercent: number): number {
  const noise = (rng() - 0.5) * 2 * noisePercent * value;
  return value + noise;
}

/**
 * Generate energy reading with all factors applied
 */
function generateEnergyReading(
  zone: ZoneConfig,
  timestamp: Date,
  anomaly: Anomaly | null,
): number {
  const hour = timestamp.getUTCHours();
  const isOperating = isZoneOperating(zone, timestamp);
  const weekend = isWeekend(timestamp);

  // Base energy in expected range
  let baseEnergy =
    zone.expectedRange.min +
    rng() * (zone.expectedRange.max - zone.expectedRange.min);

  // Apply time-of-day factor
  baseEnergy *= getTimeOfDayFactor(hour);

  // Weekend reduction (except warehouse which is steady)
  if (weekend && zone.id !== "warehouse") {
    baseEnergy *= 0.7;
  }

  // If not operating, minimal usage
  if (!isOperating) {
    baseEnergy = zone.expectedRange.min * (0.1 + rng() * 0.1);
  }

  // Spiky pattern for stamping press
  if (zone.id === "stamping-press" && isOperating) {
    const second = timestamp.getUTCSeconds();
    if (second % 10 < 3) {
      baseEnergy *= 1.25;
    }
  }

  // Apply anomalies
  if (anomaly) {
    switch (anomaly.type) {
      case "spike":
        baseEnergy *= 2.0;
        break;
      case "drop":
        baseEnergy *= 0.5;
        break;
      case "flatline":
        // Return fixed value (will be same for all readings in this period)
        return (
          zone.expectedRange.min +
          (zone.expectedRange.max - zone.expectedRange.min) * 0.6
        );
      case "overnight":
        // Paint shop running when it shouldn't - use daytime levels
        baseEnergy =
          zone.expectedRange.min +
          rng() * (zone.expectedRange.max - zone.expectedRange.min) * 0.8;
        break;
      case "decline":
        // Gradual decline - calculate progress through anomaly period
        const progress =
          (timestamp.getTime() - anomaly.startTime.getTime()) /
          (anomaly.endTime.getTime() - anomaly.startTime.getTime());
        baseEnergy *= 1.0 - progress * 0.6; // Decline to 40% of normal
        break;
    }
  }

  // Add random noise (±5-8%)
  return Math.max(0, addNoise(baseEnergy, 0.05 + rng() * 0.03));
}

/**
 * Generate temperature correlated with energy usage
 */
function generateTemperature(
  zone: ZoneConfig,
  energyKw: number,
  timestamp: Date,
): number {
  // Base temperature varies slightly by time of day
  const hour = timestamp.getUTCHours();
  const dayNightVariation = Math.sin(((hour - 6) / 24) * 2 * Math.PI) * 2;

  // Higher energy = slightly higher temperature
  const energyMidpoint = (zone.expectedRange.min + zone.expectedRange.max) / 2;
  const energyFactor = ((energyKw - energyMidpoint) / energyMidpoint) * 3;

  const temp = zone.baselineTemperature + dayNightVariation + energyFactor;
  return addNoise(temp, 0.02);
}

// ============================================================================
// Main Generation Logic
// ============================================================================

async function generateHistoricalData(): Promise<void> {
  console.log(
    "╔════════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║     Ford Energy Dashboard - Historical Data Generator          ║",
  );
  console.log(
    "╠════════════════════════════════════════════════════════════════╣",
  );
  console.log(`║  Seed: ${SEED.padEnd(47)}║`);
  console.log(
    `║  Date range: ${START_DATE.toISOString().slice(0, 10)} to ${END_DATE.toISOString().slice(0, 10)}               ║`,
  );
  console.log(
    `║  Interval: ${INTERVAL_SECONDS} seconds                                        ║`,
  );
  console.log(
    `║  Zones: ${ZONES.length}                                                      ║`,
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════╝",
  );
  console.log("");

  const readings: SensorReading[] = [];
  let totalReadings = 0;
  let skippedForGaps = 0;

  // Calculate total expected readings for progress tracking
  const totalSeconds = (END_DATE.getTime() - START_DATE.getTime()) / 1000;
  const readingsPerZone = Math.floor(totalSeconds / INTERVAL_SECONDS);
  const expectedTotal = readingsPerZone * ZONES.length;

  console.log(`Expected readings: ~${expectedTotal.toLocaleString()}`);
  console.log("");

  // Generate readings for each timestamp
  let currentTime = new Date(START_DATE);
  let lastProgressLog = 0;

  while (currentTime < END_DATE) {
    for (const zone of ZONES) {
      // Check for data gap
      if (isInDataGap(zone.id, currentTime)) {
        skippedForGaps++;
        continue;
      }

      // Check for active anomaly
      const anomaly = getActiveAnomaly(zone.id, currentTime);

      // Generate energy reading
      const energyKw = generateEnergyReading(zone, currentTime, anomaly);
      const temperature = generateTemperature(zone, energyKw, currentTime);

      readings.push({
        timestamp: currentTime.toISOString(),
        zoneId: zone.id,
        zoneName: zone.name,
        energyKw: Math.round(energyKw * 10) / 10,
        temperature: Math.round(temperature * 10) / 10,
        equipmentCount: zone.equipmentCount,
      });

      totalReadings++;
    }

    // Progress logging every 10%
    const progress = Math.floor((totalReadings / expectedTotal) * 100);
    if (progress >= lastProgressLog + 10) {
      console.log(
        `  Progress: ${progress}% (${totalReadings.toLocaleString()} readings)`,
      );
      lastProgressLog = progress;
    }

    // Advance to next interval
    currentTime = new Date(currentTime.getTime() + INTERVAL_SECONDS * 1000);
  }

  console.log("");
  console.log(`✅ Generated ${totalReadings.toLocaleString()} readings`);
  console.log(`   Skipped ${skippedForGaps} readings due to data gaps`);

  // Sort by timestamp
  readings.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Write to file
  const outputPath = path.join(__dirname, "../../data/historical-data.json");
  const outputDir = path.dirname(outputPath);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("");
  console.log(`📁 Writing to: ${outputPath}`);

  fs.writeFileSync(outputPath, JSON.stringify(readings, null, 2));

  const stats = fs.statSync(outputPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`   File size: ${fileSizeMB} MB`);
  console.log("");

  // Log anomaly timestamps for reference
  console.log(
    "═══════════════════════════════════════════════════════════════════",
  );
  console.log("ANOMALY REFERENCE (for evaluators):");
  console.log(
    "═══════════════════════════════════════════════════════════════════",
  );
  for (const anomaly of ANOMALIES) {
    console.log(
      `  • ${anomaly.zoneId.padEnd(16)} | ${anomaly.type.padEnd(10)} | ${anomaly.startTime.toISOString()} - ${anomaly.endTime.toISOString()}`,
    );
    console.log(`    ${anomaly.description}`);
  }
  console.log("");

  console.log("DATA GAPS:");
  console.log(
    "───────────────────────────────────────────────────────────────────",
  );
  for (const gap of DATA_GAPS) {
    const durationMinutes =
      (gap.endTime.getTime() - gap.startTime.getTime()) / 60000;
    console.log(
      `  • ${gap.zoneId.padEnd(16)} | ${gap.startTime.toISOString()} - ${gap.endTime.toISOString()} (${durationMinutes} min)`,
    );
  }
  console.log("");

  console.log("✨ Data generation complete!");
}

// Run the generator
generateHistoricalData().catch((error) => {
  console.error("Error generating data:", error);
  process.exit(1);
});
