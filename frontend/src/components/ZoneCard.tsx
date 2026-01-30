import { useMemo } from 'react';
import type { EnergyReading, Anomaly } from '../types';
import { getAnomalyIcon } from '../utils/anomalyDetection';
import './ZoneCard.css';

interface ZoneCardProps {
  reading: EnergyReading;
  anomalies: Anomaly[];
}

export function ZoneCard({ reading, anomalies }: ZoneCardProps) {
  // Find most recent anomaly for this zone (within last 5 seconds)
  const recentAnomaly = useMemo(() => {
    const fiveSecondsAgo = Date.now() - 5000;
    return anomalies
      .filter(a => a.zoneId === reading.zoneId)
      .filter(a => new Date(a.timestamp).getTime() > fiveSecondsAgo)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  }, [anomalies, reading.zoneId]);

  const hasAnomaly = !!recentAnomaly;
  const cardClass = hasAnomaly
    ? `zone-card zone-card-${recentAnomaly.severity}`
    : 'zone-card';

  return (
    <div className={cardClass}>
      <div className="zone-header">
        <h3>
          {reading.zoneName}
          {hasAnomaly && (
            <span className="anomaly-badge" title={`${recentAnomaly.type} detected`}>
              {getAnomalyIcon(recentAnomaly)}
            </span>
          )}
        </h3>
      </div>
      
      <div className="zone-content">
        {/* Main energy reading */}
        <div className="energy-value">
          <span className="value">{reading.energyKw.toFixed(1)}</span>
          <span className="unit">kW</span>
        </div>

        {/* Anomaly warning */}
        {hasAnomaly && (
          <div className={`anomaly-warning anomaly-${recentAnomaly.severity}`}>
            <strong>{recentAnomaly.type.toUpperCase()}:</strong> {recentAnomaly.value.toFixed(1)} kW
          </div>
        )}

        {/* Additional info */}
        <div className="zone-details">
          <div className="detail">
            <span className="icon">🌡️</span>
            <span>{reading.temperature.toFixed(1)}°C</span>
          </div>
          <div className="detail">
            <span className="icon">⚙️</span>
            <span>{reading.equipmentCount} units</span>
          </div>
        </div>
      </div>
    </div>
  );
}