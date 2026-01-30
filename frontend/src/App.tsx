import { EnergyProvider } from './context/EnergyContext';
import { Dashboard } from './components/Dashboard';
import './App.css';

function App() {
  return (
    <EnergyProvider>
      <Dashboard />
    </EnergyProvider>
  );
}

export default App;
