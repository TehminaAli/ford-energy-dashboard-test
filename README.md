# Energy Dashboard - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start the Mock Server

```bash
npm run dev
```

You should see:

```
╔════════════════════════════════════════════════════════════════╗
║     Ford Energy Dashboard - Mock WebSocket Server              ║
║  Status: Running                                               ║
║  URL: ws://localhost:8080                                      ║
╚════════════════════════════════════════════════════════════════╝
```

### 3. Connect Your Application

**WebSocket URL:** `ws://localhost:8080`

The server broadcasts sensor data every 100ms, rotating through all 5 zones.

---

## Data Format

### WebSocket Messages

```json
{
  "timestamp": "2026-01-19T14:30:45.123Z",
  "zoneId": "assembly-1",
  "zoneName": "Assembly Line 1",
  "energyKw": 245.6,
  "temperature": 22.4,
  "equipmentCount": 12
}
```

### Historical Data

Load `data/historical-data.json` for 7 days of historical readings (12–18 January 2026).

### Zone Configuration

Load `data/zones-config.json` for zone metadata including expected ranges and thresholds.

---

## Manufacturing Zones

| Zone            | Expected Range | Operating Hours |
| --------------- | -------------- | --------------- |
| Assembly Line 1 | 220–280 kW     | 24/7            |
| Paint Shop      | 150–200 kW     | 6am–10pm        |
| Stamping Press  | 300–400 kW     | 24/7            |
| Quality Control | 50–80 kW       | 7am–7pm         |
| Warehouse       | 20–40 kW       | 24/7            |

---

## Example Connection

```typescript
const ws = new WebSocket("ws://localhost:8080");

ws.onmessage = (event) => {
  const reading = JSON.parse(event.data);
  console.log(`[${reading.zoneName}] ${reading.energyKw} kW`);
};
```

---

## Troubleshooting

| Issue                     | Solution                                         |
| ------------------------- | ------------------------------------------------ |
| "Cannot find module 'ws'" | Run `npm install` in `backend/`                  |
| "Address already in use"  | Stop other process on port 8080: `lsof -i :8080` |
| "Connection refused"      | Make sure server is running: `npm run dev`       |

---

See `docs/TECH_TEST_CANDIDATE_BRIEF.md` for full requirements.

Good luck! 🚀
