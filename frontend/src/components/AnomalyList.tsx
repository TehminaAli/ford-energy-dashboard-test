import React, { useMemo } from 'react';
import type { Anomaly } from '../types';
import { getAnomalyIcon, getAnomalyDescription } from '../utils/anomalyDetection';
import './AnomalyList.css';

interface AnomalyListProps {
  anomalies: Anomaly[];
}

interface AnomalyItemProps {
  anomaly: Anomaly;
}

// Utility for className concatenation
const cn = (...classes: string[]) => classes.join(' ');

// Memoized anomaly item component
const AnomalyItem = React.memo(({ anomaly }: AnomalyItemProps) => (
  <div className={cn('anomaly-item', `anomaly-item-${anomaly.severity}`)}>
    <div className="anomaly-header">
      <span className="anomaly-icon">{getAnomalyIcon(anomaly)}</span>
      <span className="anomaly-zone">{anomaly.zoneName}</span>
      <span className={cn('anomaly-type', `anomaly-type-${anomaly.type}`)}>
        {anomaly.type.toUpperCase()}
      </span>
    </div>
    
    <div className="anomaly-details">
      <div className="anomaly-description">
        {getAnomalyDescription(anomaly)}
      </div>
      <div className="anomaly-time">
        {new Date(anomaly.timestamp).toLocaleTimeString()}
      </div>
    </div>
  </div>
));

AnomalyItem.displayName = 'AnomalyItem';

export function AnomalyList({ anomalies }: AnomalyListProps) {
  // Memoize recent anomalies computation
  const recentAnomalies = useMemo(
    () => anomalies.slice(-20).reverse(),
    [anomalies]
  );

  if (recentAnomalies.length === 0) {
    return (
      <div className="anomaly-list">
        <h2>Anomaly Alerts</h2>
        <div className="no-anomalies">
          <span className="icon">✅</span>
          <p>No anomalies detected. All zones operating normally.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="anomaly-list">
      <h2>
        Anomaly Alerts
        <span className="anomaly-count">{recentAnomalies.length}</span>
      </h2>
      
      <div className="anomaly-items">
        {recentAnomalies.map((anomaly) => (
          <AnomalyItem key={anomaly.id} anomaly={anomaly} />
        ))}
      </div>
    </div>
  );
}