import { TEAMS } from "../lib/gameConfig";

export default function TeamSelect({ onSelect, onAdmin }) {
  return (
    <div className="page team-select-page">
      <div className="select-header">
        <img src="/logo.png" alt="Batallón Pablo César Barton" className="battalion-logo" />
        <div className="battalion-name">Batallón Pablo César Barton</div>
        <div className="game-title">OPERACIÓN<br /><span>BOMBA</span></div>
        <div className="mission-tag">
          <span className="mission-dot" />
          Misión activa
        </div>
      </div>

      <div className="select-body">
        <div className="select-label">Seleccioná tu equipo</div>
        <div className="teams-grid">
          {TEAMS.map((team) => (
            <button
              key={team.id}
              className="team-btn"
              style={{ "--team-color": team.color }}
              onClick={() => onSelect(team)}
            >
              <span className="team-emoji">{team.emoji}</span>
              <span className="team-label">{team.name}</span>
            </button>
          ))}
        </div>
        <p className="footer-hint">
          Todos los jugadores del mismo equipo deben seleccionar el mismo color
        </p>
        <button className="admin-access-btn" onClick={onAdmin}>
          ⚙️ Panel Admin
        </button>
      </div>
    </div>
  );
}
