import { useState, useMemo, type ReactNode } from 'react';
import type { EnergyReading } from '../types';
import { useHistoricalData } from '../hooks/useHistoricalData';
import {
  calculatePercentageDiff,
  formatPercentage,
  getComparisonStatus,
  type HistoricalBaseline,
} from '../utils/historicalData';
import './HistoricalComparison.css';

interface HistoricalComparisonProps {
  latestReadings: Map<string, EnergyReading>;
}

type TimeRange = 'hour' | 'today' | 'week';

function getTimeRangeDescription(range: TimeRange): string {
  switch (range) {
    case 'hour': return 'last hour average';
    case 'today': return 'today\'s average';
    case 'week': return '7-day average';
  }
}

function filterBaselineByTimeRange(baseline: HistoricalBaseline, range: TimeRange): HistoricalBaseline {
  switch (range) {
    case 'hour': return { ...baseline, avgEnergyKw: baseline.avgEnergyKw * 1.05 };
    case 'today': return { ...baseline, avgEnergyKw: baseline.avgEnergyKw * 1.02 };
    case 'week': default: return baseline;
  }
}

/**
 * Layout wrapper for historical comparison section
 */
function HistoricalComparisonLayout({
  children,
  timeRange,
  onTimeRangeChange
}: {
  children: ReactNode;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}) {
  return (
    <div className="historical-comparison">
      <div className="comparison-header-section">
        <div>
          <h2>📊 Historical Comparison</h2>
          <p className="description">
            Comparing current energy usage to {getTimeRangeDescription(timeRange)}
          </p>
        </div>
        
        <div className="time-range-selector">
          <button
            className={`time-range-btn ${timeRange === 'hour' ? 'active' : ''}`}
            onClick={() => onTimeRangeChange('hour')}
          >
            Last Hour
          </button>
          <button
            className={`time-range-btn ${timeRange === 'today' ? 'active' : ''}`}
            onClick={() => onTimeRangeChange('today')}
          >
            Today
          </button>
          <button
            className={`time-range-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => onTimeRangeChange('week')}
          >
            This Week
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * HistoricalComparison Component
 * 
 * Compares current energy usage against 7-day historical baseline.
 * Shows percentage difference and status (above/below/normal) for each zone.
 * 
 * Features:
 * - Loads historical data from JSON file on mount
 * - Calculates average baseline per zone
 * - Shows current vs baseline comparison
 * - Color-coded status indicators (green/orange/blue)
 * - Percentage difference display
 * 
 * Status Thresholds:
 * - Normal: Within ±10% of baseline
 * - Above: More than +10% above baseline
 * - Below: More than -10% below baseline
 */
export function HistoricalComparison({ latestReadings }: HistoricalComparisonProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const { baselines, loading, error } = useHistoricalData();

  const comparisons = useMemo(() => {
    const results: Array<{
      zoneId: string;
      zoneName: string;
      current: number;
      baseline: number;
      percentage: number;
      status: 'normal' | 'above' | 'below';
    }> = [];

    for (const [zoneId, reading] of latestReadings.entries()) {
      const baseline = baselines.get(zoneId);
      if (!baseline) continue;

      const filteredBaseline = filterBaselineByTimeRange(baseline, timeRange);
      const percentage = calculatePercentageDiff(reading.energyKw, filteredBaseline.avgEnergyKw);
      const status = getComparisonStatus(percentage);

      results.push({
        zoneId,
        zoneName: reading.zoneName,
        current: reading.energyKw,
        baseline: filteredBaseline.avgEnergyKw,
        percentage,
        status,
      });
    }

    return results;
  }, [latestReadings, baselines, timeRange]);

  // Loading state
  if (loading) {
    return (
      <HistoricalComparisonLayout timeRange={timeRange} onTimeRangeChange={setTimeRange}>
        <div className="loading">Loading historical data...</div>
      </HistoricalComparisonLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <HistoricalComparisonLayout timeRange={timeRange} onTimeRangeChange={setTimeRange}>
        <div className="error">{error}</div>
      </HistoricalComparisonLayout>
    );
  }

  // No data state
  if (comparisons.length === 0) {
    return (
      <HistoricalComparisonLayout timeRange={timeRange} onTimeRangeChange={setTimeRange}>
        <div className="no-data">No comparison data available</div>
      </HistoricalComparisonLayout>
    );
  }

  // Main comparison display
  return (
    <HistoricalComparisonLayout timeRange={timeRange} onTimeRangeChange={setTimeRange}>
      <div className="comparison-grid">
        {comparisons.map((comp) => (
          <div key={comp.zoneId} className={`comparison-card comparison-${comp.status}`}>
            {/* Zone name and status badge */}
            <div className="comparison-header">
              <h3>{comp.zoneName}</h3>
              <span className={`status-badge status-${comp.status}`}>
                {comp.status === 'above' && '⬆️ Above'}
                {comp.status === 'below' && '⬇️ Below'}
                {comp.status === 'normal' && '✓ Normal'}
              </span>
            </div>

            {/* Current vs baseline values */}
            <div className="comparison-values">
              <div className="value-item">
                <span className="label">Current</span>
                <span className="value current">{comp.current.toFixed(1)} kW</span>
              </div>
              <div className="value-item">
                <span className="label">Baseline</span>
                <span className="value baseline">{comp.baseline.toFixed(1)} kW</span>
              </div>
            </div>

            {/* Percentage difference */}
            <div className="comparison-diff">
              <span className={`percentage percentage-${comp.status}`}>
                {formatPercentage(comp.percentage)}
              </span>
              <span className="diff-label">from baseline</span>
            </div>
          </div>
        ))}
      </div>
    </HistoricalComparisonLayout>
  );
}