import { useTeams } from "../hooks/useGame";
import { TEAMS, TOTAL_BOMBS } from "../lib/gameConfig";

export default function Ranking({ onBack, currentTeamId }) {
  const teams = useTeams();

  const sorted = TEAMS.map((t) => ({
    ...t,
    bombs: teams ? teams[t.id]?.bombs ?? TOTAL_BOMBS : TOTAL_BOMBS,
  })).sort((a, b) => a.bombs - b.bombs);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="page ranking-page">
      <div className="ranking-topbar">
        <button className="back-btn" onClick={onBack}>← Volver</button>
        <div className="ranking-title-bar">🏆 Clasificación</div>
        <span style={{width: 70}} />
      </div>

      <div className="ranking-header-section">
        <img src="/logo.png" alt="logo" className="ranking-logo" />
        <div className="ranking-subtitle">Progreso de equipos — Tiempo real</div>
      </div>

      <div className="ranking-list">
        {sorted.map((team, idx) => {
          const won = team.bombs === 0;
          const isMe = team.id === currentTeamId;
          const defused = TOTAL_BOMBS - team.bombs;
          const pct = (defused / TOTAL_BOMBS) * 100;

          return (
            <div
              key={team.id}
              className={`ranking-row ${isMe ? "me" : ""} ${won ? "won" : ""}`}
              style={{ "--team-color": team.color }}
            >
              <div className="rank-pos">
                {won ? medals[0] : medals[idx] || `${idx + 1}`}
              </div>
              <div className="rank-info">
                <div className="rank-name">
                  {team.emoji} {team.name}
                  {isMe && <span className="you-badge">TÚ</span>}
                </div>
                <div className="rank-bar-wrap">
                  <div className="rank-bar" style={{ width: `${pct}%` }} />
                </div>
                <div className="rank-detail">
                  {won
                    ? "✅ Misión completada"
                    : `${defused}/${TOTAL_BOMBS} desactivadas · ${team.bombs} restantes`}
                </div>
              </div>
              <div className="rank-bombs">
                {won ? "✓" : team.bombs}
              </div>
            </div>
          );
        })}
      </div>

      <div className="live-badge">
        <span className="live-dot" /> En vivo
      </div>
    </div>
  );
}
