import { useState } from "react";
import { useTeams, deactivateBomb } from "../hooks/useGame";
import { TOTAL_BOMBS, TEAMS } from "../lib/gameConfig";

function BombIcons({ remaining, total }) {
  return (
    <div className="bombs-row">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`bomb-icon ${i < remaining ? "active" : "defused"}`}>
          {i < remaining ? "💣" : "💨"}
        </span>
      ))}
    </div>
  );
}

export default function GameBoard({ team, onRanking, onBack }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const teams = useTeams();

  const teamConfig = TEAMS.find((t) => t.id === team.id);
  const bombs = teams ? teams[team.id]?.bombs ?? TOTAL_BOMBS : TOTAL_BOMBS;
  const won = bombs === 0;

  async function handleDeactivate() {
    if (!code.trim()) return;
    setLoading(true);
    setMessage(null);
    const result = await deactivateBomb(team.id, code);
    setMessage(result);
    setCode("");
    setLoading(false);
    setTimeout(() => setMessage(null), result.success ? 4000 : 3000);
  }

  const counterClass = won ? "won" : bombs === 1 ? "critical" : "";

  return (
    <div className="page game-board-page" style={{ "--team-color": teamConfig.color }}>
      {/* Top bar */}
      <div className="board-topbar">
        <button className="back-btn" onClick={onBack}>← Equipos</button>
        <span className="team-topbadge">{teamConfig.emoji} {team.name}</span>
        <button className="ranking-btn" onClick={onRanking}>🏆 Ranking</button>
      </div>

      {/* Hero */}
      <div className="board-hero">
        <img src="/logo.png" alt="logo" className="board-logo" />
        <div className="board-team-name">{team.name}</div>
        <div className="board-mission">Batallón Pablo César Barton</div>
      </div>

      {/* Bombs */}
      <div className="bombs-panel">
        <div className="bombs-label">Bombas restantes</div>
        <div className={`bombs-counter ${counterClass}`}>
          {won ? "✓" : bombs}
        </div>
        <BombIcons remaining={bombs} total={TOTAL_BOMBS} />
        <div className={`status-text ${won ? "won-text" : ""}`}>
          {won
            ? "¡Todas las bombas desactivadas!"
            : `${bombs} bomba${bombs !== 1 ? "s" : ""} por desactivar`}
        </div>
      </div>

      <div className="section-divider" />

      {/* Message */}
      {message && (
        <div className={`message-box ${message.success ? "success" : "error"}`}>
          {message.message}
        </div>
      )}

      {/* Code input */}
      {!won ? (
        <div className="code-section">
          <p className="code-hint">
            Ingresá el código que viste en la espalda de otro jugador
          </p>
          <input
            className="code-input"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleDeactivate()}
            placeholder="CÓDIGO"
            maxLength={10}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button
            className="deactivate-btn"
            onClick={handleDeactivate}
            disabled={loading || !code.trim()}
          >
            {loading ? "⏳ Verificando..." : "💣 Desactivar Bomba"}
          </button>
        </div>
      ) : (
        <div className="won-section">
          <div className="won-badge">🏆 ¡Misión cumplida! Siempre listos</div>
          <button className="ranking-big-btn" onClick={onRanking}>
            Ver Ranking 🏆
          </button>
        </div>
      )}
    </div>
  );
}
