import type { EnergyReading } from '../types';

export interface HistoricalBaseline {
  zoneId: string;
  zoneName: string;
  avgEnergyKw: number;
  minEnergyKw: number;
  maxEnergyKw: number;
  dataPoints: number;
}

/**
 * Load historical data from JSON file
 */
export async function loadHistoricalData(): Promise<EnergyReading[]> {
  try {
    const response = await fetch('/data/historical-data.json');
    if (!response.ok) {
      throw new Error(`Failed to load historical data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading historical data:', error);
    return [];
  }
}

/**
 * Calculate baseline statistics for each zone from historical data
 */
export function calculateBaselines(
  historicalData: EnergyReading[]
): Map<string, HistoricalBaseline> {
  const zoneData = new Map<string, number[]>();

  // Group energy readings by zone
  for (const reading of historicalData) {
    if (!zoneData.has(reading.zoneId)) {
      zoneData.set(reading.zoneId, []);
    }
    zoneData.get(reading.zoneId)!.push(reading.energyKw);
  }

  // Calculate statistics for each zone
  const baselines = new Map<string, HistoricalBaseline>();
  
  for (const [zoneId, energyValues] of zoneData.entries()) {
    const sum = energyValues.reduce((acc, val) => acc + val, 0);
    const avg = sum / energyValues.length;
    const min = Math.min(...energyValues);
    const max = Math.max(...energyValues);
    
    // Get zone name from first reading
    const zoneName = historicalData.find(r => r.zoneId === zoneId)?.zoneName || zoneId;
    
    baselines.set(zoneId, {
      zoneId,
      zoneName,
      avgEnergyKw: avg,
      minEnergyKw: min,
      maxEnergyKw: max,
      dataPoints: energyValues.length,
    });
  }

  return baselines;
}

/**
 * Calculate percentage difference from baseline
 */
export function calculatePercentageDiff(
  current: number,
  baseline: number
): number {
  if (baseline === 0) return 0;
  return ((current - baseline) / baseline) * 100;
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number): string {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
}

/**
 * Get status based on percentage difference
 */
export function getComparisonStatus(
  percentage: number
): 'normal' | 'above' | 'below' {
  if (Math.abs(percentage) < 10) return 'normal';
  return percentage > 0 ? 'above' : 'below';
}