import type { ConnectionStatus as Status } from '../types';
import './ConnectionStatus.css';

interface ConnectionStatusProps {
  status: Status;
  attempts: number;
}

export function ConnectionStatus({ status, attempts }: ConnectionStatusProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'CONNECTED':
        return { icon: '🟢', text: 'Connected', className: 'connected' };
      case 'CONNECTING':
        return { icon: '🟡', text: 'Connecting...', className: 'connecting' };
      case 'DISCONNECTED':
        return { icon: '🔴', text: `Disconnected (${attempts}/5)`, className: 'disconnected' };
      case 'ERROR':
        return { icon: '⚠️', text: 'Connection Error', className: 'error' };
    }
  };

  const info = getStatusInfo();

  return (
    <div className={`connection-status ${info.className}`}>
      <span className="status-icon">{info.icon}</span>
      <span className="status-text">{info.text}</span>
    </div>
  );
}