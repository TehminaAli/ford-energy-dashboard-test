import type { EnergyReading, Anomaly, AnomalyType } from '../types';

/**
 * Anomaly Detection Algorithm: Hybrid Threshold + Pattern-Based
 * 
 * Approach:
 * 1. Threshold-based: Uses zone configuration expected ranges
 * 2. Pattern-based: Detects sudden changes (>30% from previous reading)
 * 
 * Detection Rules:
 * - Spike: Energy > 1.5x expected max OR >30% increase from previous
 * - Drop: Energy < 0.5x expected min OR >30% decrease from previous
 * 
 * Severity:
 * - Critical: >2x threshold or >50% change
 * - Warning: >1.5x threshold or >30% change
 */

// Zone expected ranges (from zones-config.json)
const ZONE_RANGES: Record<string, { min: number; max: number }> = {
  'assembly-1': { min: 220, max: 280 },
  'paint-shop': { min: 150, max: 200 },
  'stamping-press': { min: 300, max: 400 },
  'quality-control': { min: 50, max: 80 },
  'warehouse': { min: 20, max: 40 },
};

/**
 * Helper to calculate severity based on threshold multiplier
 */
function calculateSeverity(value: number, threshold: number, criticalMultiplier: number): 'critical' | 'warning' {
  return value > threshold * criticalMultiplier ? 'critical' : 'warning';
}

/**
 * Helper to create anomaly object
 */
function createAnomaly(
  reading: EnergyReading,
  type: AnomalyType,
  threshold: number,
  severity: 'critical' | 'warning'
): Anomaly {
  return {
    id: `${reading.zoneId}-${reading.timestamp}`,
    type,
    zoneId: reading.zoneId,
    zoneName: reading.zoneName,
    timestamp: reading.timestamp,
    value: reading.energyKw,
    threshold,
    severity,
  };
}

/**
 * Detect anomalies in energy reading using hybrid approach
 */
export function detectAnomaly(
  reading: EnergyReading,
  previousReading?: EnergyReading
): Anomaly | null {
  const range = ZONE_RANGES[reading.zoneId];
  if (!range) return null;

  const { energyKw } = reading;
  const spikeThreshold = range.max * 1.5;
  const dropThreshold = range.min * 0.5;

  // 1. THRESHOLD-BASED DETECTION
  
  // Check for spike (>1.5x max)
  if (energyKw > spikeThreshold) {
    const severity = calculateSeverity(energyKw, range.max, 2);
    return createAnomaly(reading, 'spike', spikeThreshold, severity);
  }

  // Check for drop (<0.5x min)
  if (energyKw < dropThreshold) {
    const severity = energyKw < range.min * 0.3 ? 'critical' : 'warning';
    return createAnomaly(reading, 'drop', dropThreshold, severity);
  }

  // 2. PATTERN-BASED DETECTION (sudden changes)
  if (!previousReading || previousReading.zoneId !== reading.zoneId) {
    return null;
  }

  const percentChange = Math.abs(
    (energyKw - previousReading.energyKw) / previousReading.energyKw
  );
  
  // Check for sudden change (>30%)
  if (percentChange <= 0.3) {
    return null;
  }

  const type: AnomalyType = energyKw > previousReading.energyKw ? 'spike' : 'drop';
  const severity = percentChange > 0.5 ? 'critical' : 'warning';
  return createAnomaly(reading, type, previousReading.energyKw, severity);
}

/**
 * Get human-readable anomaly description
 */
export function getAnomalyDescription(anomaly: Anomaly): string {
  const { type, value, threshold } = anomaly;
  
  switch (type) {
    case 'spike':
      return `Energy spiked to ${value.toFixed(1)} kW (threshold: ${threshold.toFixed(1)} kW)`;
    case 'drop':
      return `Energy dropped to ${value.toFixed(1)} kW (threshold: ${threshold.toFixed(1)} kW)`;
    case 'flatline':
      return `Energy flatlined at ${value.toFixed(1)} kW`;
    default:
      return `Unusual reading: ${value.toFixed(1)} kW`;
  }
}

/**
 * Get anomaly icon based on type and severity
 */
export function getAnomalyIcon(anomaly: Anomaly): string {
  if (anomaly.severity === 'critical') {
    return '🚨';
  }
  return anomaly.type === 'spike' ? '⬆️' : '⬇️';
}