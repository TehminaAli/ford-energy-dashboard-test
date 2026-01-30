import { useEffect, useRef, useState } from 'react';
import type { EnergyReading, ConnectionStatus } from '../types';

const WS_URL = 'ws://localhost:8080';
const MAX_RECONNECT = 5;

// Custom hook for WebSocket connection with auto-reconnect
export function useWebSocket(onMessage: (reading: EnergyReading) => void) {
  const [status, setStatus] = useState<ConnectionStatus>('CONNECTING');
  const [attempts, setAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      const ws = new WebSocket(WS_URL);
      
      // Connection established
      ws.onopen = () => {
        if (!isMounted) return;
        setStatus('CONNECTED');
        setAttempts(0);
        reconnectAttemptsRef.current = 0;
      };

      // Handle incoming messages
      ws.onmessage = (e) => {
        if (!isMounted) return;
        try {
          onMessage(JSON.parse(e.data));
        } catch (err) {
          console.error('Parse error:', err);
        }
      };

      ws.onerror = () => {
        if (!isMounted) return;
        setStatus('ERROR');
      };

      // Handle disconnection with exponential backoff
      ws.onclose = () => {
        if (!isMounted) return;
        setStatus('DISCONNECTED');
        
        if (reconnectAttemptsRef.current < MAX_RECONNECT) {
          const delay = 1000 * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current++;
          setAttempts(reconnectAttemptsRef.current);
          
          timeoutRef.current = window.setTimeout(() => {
            if (isMounted) {
              setStatus('CONNECTING');
              connect();
            }
          }, delay);
        }
      };

      wsRef.current = ws;
    };

    connect();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []); // Empty dependency array - only run once!

  return { status, attempts };
}