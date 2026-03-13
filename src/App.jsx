import { useState, useEffect } from "react";
import TeamSelect from "./pages/TeamSelect";
import GameBoard from "./pages/GameBoard";
import Ranking from "./pages/Ranking";
import Admin from "./pages/Admin";
import { initializeGame } from "./hooks/useGame";
import "./App.css";

export default function App() {
  const [view, setView] = useState("select");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeGame().then(() => setReady(true)).catch(console.error);
  }, []);

  if (!ready) {
    return (
      <div className="loading-screen">
        <img src="/logo.png" alt="logo" className="loading-logo" />
        <div className="loading-text">Cargando misión...</div>
      </div>
    );
  }

  return (
    <div className="app-root">
      {view === "select" && (
        <TeamSelect
          onSelect={(team) => { setSelectedTeam(team); setView("game"); }}
          onAdmin={() => setView("admin")}
        />
      )}
      {view === "game" && selectedTeam && (
        <GameBoard
          team={selectedTeam}
          onRanking={() => setView("ranking")}
          onBack={() => setView("select")}
        />
      )}
      {view === "ranking" && (
        <Ranking
          onBack={() => setView(selectedTeam ? "game" : "select")}
          currentTeamId={selectedTeam?.id}
        />
      )}
      {view === "admin" && (
        <Admin onBack={() => setView("select")} />
      )}
    </div>
  );
}
