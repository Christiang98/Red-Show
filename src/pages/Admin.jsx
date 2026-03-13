import { useState } from "react";
import { startNewGame, getCurrentCodes } from "../hooks/useGame";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { TEAMS, TOTAL_BOMBS, ADMIN_PIN, CODE_POOL } from "../lib/gameConfig";

// ── Helpers ──────────────────────────────────────
async function startManualGame(manualAssigned) {
  const teams = {};
  TEAMS.forEach((t) => {
    const codesObj = {};
    manualAssigned[t.id].forEach((code, i) => { codesObj[`code${i}`] = code; });
    teams[t.id] = { bombs: TOTAL_BOMBS, name: t.name, codes: codesObj };
  });
  await setDoc(doc(db, "game", "state"), { teams, startedAt: Date.now() });

  const codes = {};
  TEAMS.forEach((t) => {
    manualAssigned[t.id].forEach((c) => {
      if (c) codes[c] = { used: false, usedBy: null, assignedTo: t.id };
    });
  });
  await setDoc(doc(db, "game", "codes"), codes);
}

// ── Sub-componentes ───────────────────────────────
function CodesDisplay({ assigned }) {
  return (
    <div className="admin-result">
      <div className="admin-result-title">Códigos de la partida actual</div>
      <div className="admin-teams-list">
        {TEAMS.map((team) => (
          <div key={team.id} className="admin-team-card" style={{ "--team-color": team.color }}>
            <div className="admin-team-name">{team.emoji} {team.name}</div>
            <div className="admin-codes-grid">
              {(assigned[team.id] || []).map((code) => (
                <span key={code} className="admin-code-chip">{code}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="admin-hint">
        Estos son los códigos activos. Pegálos en las espaldas de los jugadores de cada equipo.
      </div>
    </div>
  );
}

function ManualAssign({ onSave, onCancel }) {
  const empty = () => TEAMS.reduce((acc, t) => {
    acc[t.id] = Array(TOTAL_BOMBS).fill("");
    return acc;
  }, {});

  const [codes, setCodes] = useState(empty);
  const [error, setError] = useState("");

  function setCode(teamId, idx, val) {
    setCodes((prev) => {
      const updated = { ...prev, [teamId]: [...prev[teamId]] };
      updated[teamId][idx] = val.trim().toUpperCase();
      return updated;
    });
    setError("");
  }

  function validate() {
    const all = [];
    for (const t of TEAMS) {
      for (let i = 0; i < TOTAL_BOMBS; i++) {
        const c = codes[t.id][i];
        if (!c) return `Falta el código ${i + 1} del ${t.name}`;
        if (all.includes(c)) return `El código "${c}" está repetido`;
        all.push(c);
      }
    }
    return null;
  }

  function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    onSave(codes);
  }

  return (
    <div className="manual-wrap">
      <div className="admin-hint" style={{ marginBottom: 12 }}>
        Ingresá exactamente {TOTAL_BOMBS} códigos por equipo. No pueden repetirse entre equipos.
      </div>

      {TEAMS.map((team) => (
        <div key={team.id} className="admin-team-card" style={{ "--team-color": team.color, marginBottom: 10 }}>
          <div className="admin-team-name">{team.emoji} {team.name}</div>
          <div className="manual-inputs">
            {Array(TOTAL_BOMBS).fill(null).map((_, i) => (
              <input
                key={i}
                className="manual-code-input"
                value={codes[team.id][i]}
                onChange={(e) => setCode(team.id, i, e.target.value)}
                placeholder={`Código ${i + 1}`}
                maxLength={10}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck="false"
              />
            ))}
          </div>
        </div>
      ))}

      {error && (
        <div className="message-box error" style={{ margin: "8px 0" }}>{error}</div>
      )}

      <div className="admin-confirm-btns" style={{ marginTop: 8 }}>
        <button className="admin-cancel-btn" onClick={onCancel}>Cancelar</button>
        <button className="admin-ok-btn" onClick={handleSave}>Guardar y jugar</button>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────
export default function Admin({ onBack }) {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [tab, setTab] = useState("game");

  // Tab "game"
  const [mode, setMode] = useState(null); // null | "random" | "manual"
  const [confirmRandom, setConfirmRandom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assigned, setAssigned] = useState(null);

  // Tab "codes"
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [currentCodes, setCurrentCodes] = useState(null);

  function handlePin() {
    if (pin === ADMIN_PIN) { setUnlocked(true); setPinError(false); }
    else { setPinError(true); setPin(""); }
  }

  async function handleRandom() {
    setLoading(true);
    try {
      const result = await startNewGame();
      setAssigned(result);
      setConfirmRandom(false);
      setMode("done");
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleManualSave(manualCodes) {
    setLoading(true);
    try {
      await startManualGame(manualCodes);
      setAssigned(manualCodes);
      setMode("done");
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleViewCodes() {
    setTab("codes");
    setLoadingCodes(true);
    try {
      const result = await getCurrentCodes();
      setCurrentCodes(result);
    } catch (e) { console.error(e); }
    setLoadingCodes(false);
  }

  // ── PIN screen ──
  if (!unlocked) {
    return (
      <div className="page admin-page">
        <div className="board-topbar">
          <button className="back-btn" onClick={onBack}>← Volver</button>
          <span className="team-topbadge" style={{ "--team-color": "var(--gold2)" }}>⚙️ Admin</span>
          <span style={{ width: 70 }} />
        </div>
        <div className="admin-pin-wrap">
          <img src="/logo.png" alt="logo" className="battalion-logo" style={{ marginBottom: 8 }} />
          <div className="admin-pin-title">Panel de Administrador</div>
          <div className="admin-pin-sub">Ingresá el PIN para continuar</div>
          <input
            className="code-input"
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handlePin()}
            placeholder="••••"
            maxLength={8}
          />
          {pinError && <div className="message-box error" style={{ marginTop: 8 }}>PIN incorrecto</div>}
          <button className="deactivate-btn" onClick={handlePin} style={{ marginTop: 4 }}>Ingresar</button>
        </div>
      </div>
    );
  }

  // ── Admin panel ──
  return (
    <div className="page admin-page">
      <div className="board-topbar">
        <button className="back-btn" onClick={onBack}>← Volver</button>
        <span className="team-topbadge" style={{ "--team-color": "var(--gold2)" }}>⚙️ Admin</span>
        <span style={{ width: 70 }} />
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === "game" ? "active" : ""}`} onClick={() => { setTab("game"); setMode(null); setAssigned(null); }}>
          🎲 Nueva partida
        </button>
        <button className={`admin-tab ${tab === "codes" ? "active" : ""}`} onClick={handleViewCodes}>
          🔑 Ver códigos
        </button>
      </div>

      <div className="admin-body">

        {/* ── TAB: Nueva partida ── */}
        {tab === "game" && (
          <>
            {/* Resultado tras crear partida */}
            {mode === "done" && assigned ? (
              <>
                <CodesDisplay assigned={assigned} />
                <button className="admin-cancel-btn" style={{ marginTop: 8 }} onClick={() => { setMode(null); setAssigned(null); }}>
                  ← Volver al menú
                </button>
              </>
            ) : mode === "manual" ? (
              <ManualAssign
                onSave={handleManualSave}
                onCancel={() => setMode(null)}
              />
            ) : mode === "random" ? (
              <>
                <div className="admin-section-title">Sorteo aleatorio</div>
                {!confirmRandom ? (
                  <>
                    <div className="admin-info-box">
                      <div className="admin-info-title">ℹ️ Cómo funciona</div>
                      <div className="admin-info-text">
                        Se sortean <strong>{TOTAL_BOMBS} códigos al azar</strong> del pool por cada equipo ({TEAMS.length} × {TOTAL_BOMBS} = {TEAMS.length * TOTAL_BOMBS} códigos). Pool disponible: <strong>{CODE_POOL.length} códigos</strong>.
                      </div>
                    </div>
                    <button className="admin-danger-btn" onClick={() => setConfirmRandom(true)}>
                      🎲 Sortear y comenzar
                    </button>
                    <button className="admin-cancel-btn" onClick={() => setMode(null)}>← Volver</button>
                  </>
                ) : (
                  <div className="admin-confirm-box">
                    <div className="admin-confirm-text">
                      ⚠️ Esto borrará la partida actual. ¿Confirmar sorteo?
                    </div>
                    <div className="admin-confirm-btns">
                      <button className="admin-cancel-btn" onClick={() => setConfirmRandom(false)}>Cancelar</button>
                      <button className="admin-ok-btn" onClick={handleRandom} disabled={loading}>
                        {loading ? "Sorteando..." : "Sí, sortear"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Menú inicial */
              <>
                <div className="admin-section-title">¿Cómo querés asignar los códigos?</div>
                <button className="admin-mode-btn" onClick={() => setMode("random")}>
                  <span className="admin-mode-icon">🎲</span>
                  <div>
                    <div className="admin-mode-title">Sorteo aleatorio</div>
                    <div className="admin-mode-sub">La app elige 5 códigos al azar por equipo del pool</div>
                  </div>
                </button>
                <button className="admin-mode-btn" onClick={() => setMode("manual")}>
                  <span className="admin-mode-icon">✏️</span>
                  <div>
                    <div className="admin-mode-title">Asignación manual</div>
                    <div className="admin-mode-sub">Vos escribís exactamente qué código va a cada equipo</div>
                  </div>
                </button>
              </>
            )}
          </>
        )}

        {/* ── TAB: Ver códigos ── */}
        {tab === "codes" && (
          loadingCodes ? (
            <div className="admin-loading">Cargando códigos...</div>
          ) : currentCodes ? (
            <CodesDisplay assigned={currentCodes} />
          ) : (
            <div className="admin-empty">No hay partida activa. Iniciá una nueva partida primero.</div>
          )
        )}

      </div>
    </div>
  );
}
