// src/lib/gameConfig.js
// ✏️ Editá los equipos y el pool de códigos acá

export const TEAMS = [
  { id: "rojo",     name: "Equipo Rojo",    color: "#ef4444", emoji: "🔴", bg: "#450a0a" },
  { id: "azul",     name: "Equipo Azul",    color: "#3b82f6", emoji: "🔵", bg: "#0c1a3a" },
  { id: "verde",    name: "Equipo Verde",   color: "#22c55e", emoji: "🟢", bg: "#0a2e10" },
  { id: "amarillo", name: "Equipo Amarillo",color: "#eab308", emoji: "🟡", bg: "#2d2000" },
  { id: "morado",   name: "Equipo Morado",  color: "#a855f7", emoji: "🟣", bg: "#1e0a2e" },
  { id: "naranja",  name: "Equipo Naranja", color: "#f97316", emoji: "🟠", bg: "#2e1000" },
];

export const TOTAL_BOMBS = 5;

// 🔑 POOL COMPLETO de códigos disponibles para sortear
// Cargá todos los códigos que van a estar pegados en las espaldas
// La app sortea 5 al azar por equipo cuando iniciás nueva partida
// Necesitás al menos: TEAMS.length × TOTAL_BOMBS códigos únicos
export const CODE_POOL = [
"A7K3","F2M9","Q8T1","B4X6","L9P2",
"D3R7","M5Z8","T1Q4","W6B9","K2N7",
"P8F3","R4T6","X7M1","Z2K9","C5Q8",
"G1P4","H9T2","J6R3","N4X7","S2M8",
"V7K1","Y3P6","B8T4","F1R9","K6Q2",
"M3X5","P9T7","R2B8","T5K4","W1M7",
"X8Q3","Z4P6","C7T9","G2M1","H5R8",
"J9K6","N1Q7","S4P3","V6T2","Y8M5"
];

// PIN para acceder al panel de administrador
export const ADMIN_PIN = "2310";
