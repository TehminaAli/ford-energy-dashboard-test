import { useEffect, useRef, useState, useCallback } from 'react';
import type { EnergyReading, ConnectionStatus } from '../types';

export function useWebSocket(
  url: string,
  onMessage: (reading: EnergyReading) => void
) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        try {
          const reading = JSON.parse(event.data) as EnergyReading;
          onMessage(reading);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      ws.onerror = () => {
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus('disconnected');

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s max
        const delays = [1000, 2000, 4000, 8000, 16000];
        const delay = delays[Math.min(reconnectAttempts, delays.length - 1)];

        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setStatus('error');
    }
  }, [url, onMessage, reconnectAttempts]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { status, reconnectAttempts };
}