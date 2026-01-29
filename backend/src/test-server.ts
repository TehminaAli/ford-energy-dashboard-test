const WS = require("ws");
const ws = new WS("ws://localhost:8080");
let count = 0;
ws.on("open", () => console.log("Connected!\\n"));
ws.on("message", (data: string) => {
  const r = JSON.parse(data);

  console.log(
    `[${r.timestamp.slice(11, 19)}] ${r.zoneName.padEnd(18)} | ${r.energyKw.toFixed(1).padStart(6)} kW | ${r.temperature.toFixed(1)}°C`,
  );
});
