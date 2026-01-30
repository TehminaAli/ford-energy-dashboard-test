import { useMemo, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEnergy } from '../context/EnergyContext';
import './EnergyChart.css';

// Zone colors for consistent visualization
const ZONE_COLORS: Record<string, string> = {
  'assembly-1': '#0066cc',
  'paint-shop': '#28a745',
  'stamping-press': '#dc3545',
  'quality-control': '#ffc107',
  'warehouse': '#6c757d',
};

const ZONE_NAMES: Record<string, string> = {
  'assembly-1': 'Assembly Line 1',
  'paint-shop': 'Paint Shop',
  'stamping-press': 'Stamping Press',
  'quality-control': 'Quality Control',
  'warehouse': 'Warehouse',
};

const MIN_DATA_POINTS = 1000; // Wait for 1000+ points before showing chart

export function EnergyChart() {
  const { readings } = useEnergy();
  const [snapshotData, setSnapshotData] = useState<any[] | null>(null);

  // Process readings into chart format using useMemo for performance
  const processedData = useMemo(() => {
    // Group readings by second (not millisecond) to align data points
    const timeMap = new Map<number, any>();

    readings.forEach((zoneReadings, zoneId) => {
      zoneReadings.forEach(reading => {
        // Round to nearest second for alignment
        const timestamp = Math.floor(new Date(reading.timestamp).getTime() / 1000) * 1000;
        
        if (!timeMap.has(timestamp)) {
          timeMap.set(timestamp, {
            timestamp,
            time: new Date(timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          });
        }
        
        const dataPoint = timeMap.get(timestamp)!;
        dataPoint[zoneId] = reading.energyKw;
      });
    });

    // Convert to array and sort by timestamp
    return Array.from(timeMap.values())
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [readings]);

  // Count total data points across all zones
  const totalDataPoints = useMemo(() => {
    let count = 0;
    readings.forEach((zoneReadings) => {
      count += zoneReadings.length;
    });
    return count;
  }, [readings]);

  // Handle update button click - take snapshot of last 1000 points
  const handleUpdate = useCallback(() => {
    const snapshot = processedData.slice(-1000);
    setSnapshotData(snapshot);
  }, [processedData]);

  // Auto-show chart once we have 1000+ points (first time only)
  useMemo(() => {
    if (snapshotData === null && totalDataPoints >= MIN_DATA_POINTS) {
      setSnapshotData(processedData.slice(-1000));
    }
  }, [totalDataPoints, processedData, snapshotData]);

  // Show loading state if we don't have enough data yet
  if (totalDataPoints < MIN_DATA_POINTS) {
    return (
      <div className="energy-chart">
        <h2>Energy Consumption Over Time</h2>
        <div style={{
          height: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          gap: '10px'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 500 }}>
            Collecting data...
          </div>
          <div style={{ fontSize: '14px' }}>
            {totalDataPoints} / {MIN_DATA_POINTS} data points
          </div>
          <div style={{
            width: '300px',
            height: '8px',
            backgroundColor: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(totalDataPoints / MIN_DATA_POINTS) * 100}%`,
              height: '100%',
              backgroundColor: '#0066cc',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>
    );
  }

  // Use snapshot data if available, otherwise use processed data
  const chartData = snapshotData || processedData.slice(-1000);

  return (
    <div className="energy-chart">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h2 style={{ margin: 0 }}>
          Energy Consumption Over Time (Last 1000 Points)
        </h2>
        <button
          onClick={handleUpdate}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0052a3'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0066cc'}
        >
          Update Chart
        </button>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            label={{ value: 'Energy (kW)', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
            formatter={(value: any) => [`${Number(value).toFixed(1)} kW`, '']}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
          />
          
          {/* Line for each zone */}
          <Line
            type="monotone"
            dataKey="assembly-1"
            stroke={ZONE_COLORS['assembly-1']}
            strokeWidth={3}
            name={ZONE_NAMES['assembly-1']}
            dot={false}
            isAnimationActive={false}
            connectNulls={true}
          />
          <Line
            type="monotone"
            dataKey="paint-shop"
            stroke={ZONE_COLORS['paint-shop']}
            strokeWidth={3}
            name={ZONE_NAMES['paint-shop']}
            dot={false}
            isAnimationActive={false}
            connectNulls={true}
          />
          <Line
            type="monotone"
            dataKey="stamping-press"
            stroke={ZONE_COLORS['stamping-press']}
            strokeWidth={3}
            name={ZONE_NAMES['stamping-press']}
            dot={false}
            isAnimationActive={false}
            connectNulls={true}
          />
          <Line
            type="monotone"
            dataKey="quality-control"
            stroke={ZONE_COLORS['quality-control']}
            strokeWidth={3}
            name={ZONE_NAMES['quality-control']}
            dot={false}
            isAnimationActive={false}
            connectNulls={true}
          />
          <Line
            type="monotone"
            dataKey="warehouse"
            stroke={ZONE_COLORS['warehouse']}
            strokeWidth={3}
            name={ZONE_NAMES['warehouse']}
            dot={false}
            isAnimationActive={false}
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}