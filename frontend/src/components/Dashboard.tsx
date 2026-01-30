import { useEnergy } from '../context/EnergyContext';
import { ConnectionStatus } from './ConnectionStatus';
import { ZoneCard } from './ZoneCard';
import { EnergyChart } from './EnergyChart';
import { AnomalyList } from './AnomalyList';
import { HistoricalComparison } from './HistoricalComparison';
import './Dashboard.css';

export function Dashboard() {
  const { latestReadings, anomalies, connectionStatus, reconnectAttempts } = useEnergy();

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Energy Dashboard</h1>
        <ConnectionStatus status={connectionStatus} attempts={reconnectAttempts} />
      </header>

      {/* Zone Cards Grid */}
      <div className="zones-grid">
        {Array.from(latestReadings.entries()).map(([zoneId, reading]) => (
          <ZoneCard key={zoneId} reading={reading} anomalies={anomalies} />
        ))}
      </div>

      {/* Time-series chart */}
      <EnergyChart />

      {/* Historical Comparison */}
      <HistoricalComparison latestReadings={latestReadings} />

      {/* Anomaly List */}
      <AnomalyList anomalies={anomalies} />
    </div>
  );
}