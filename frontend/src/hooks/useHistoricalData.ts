import { useEffect, useState } from 'react';
import { loadHistoricalData, calculateBaselines, type HistoricalBaseline } from '../utils/historicalData';

/**
 * Custom hook to load and process historical data
 * 
 * Loads historical data from JSON file on mount and calculates
 * baseline statistics (avg, min, max) for each zone.
 * 
 * Returns:
 * - baselines: Map of zone baselines
 * - loading: Loading state
 * - error: Error message if load fails
 */
export function useHistoricalData() {
  const [baselines, setBaselines] = useState<Map<string, HistoricalBaseline>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // Cleanup flag to prevent state updates after unmount

    async function loadData() {
      try {
        setLoading(true);
        
        // Fetch historical data from JSON file
        const historicalData = await loadHistoricalData();
        
        // Check if component is still mounted before updating state
        if (!isMounted) return;
        
        if (historicalData.length === 0) {
          setError('No historical data available');
          return;
        }

        // Calculate baseline statistics for each zone
        const calculatedBaselines = calculateBaselines(historicalData);
        setBaselines(calculatedBaselines);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to load historical data');
        console.error('Error loading historical data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, []); // Run once on mount

  return { baselines, loading, error };
}