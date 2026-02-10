import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Shell from "./components/Shell";
import Dashboard from "./modules/farm/Dashboard";
import { useEffect } from "react";
import { initDb } from "./core/db";
import "./styles/theme.css";

import MilkEntry from "./modules/livestock/MilkEntry";
import Workers from "./modules/workers/Workers";
import LaborLogs from "./modules/workers/LaborLogs";

function App() {
  useEffect(() => {
    initDb().catch(console.error);
  }, []);

  return (
    <Router>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/crops" element={<div className="feature-placeholder">Crop Management Module</div>} />
          <Route path="/livestock" element={<MilkEntry />} />
          <Route path="/irrigation" element={<div className="feature-placeholder">Irrigation Management Module</div>} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/finance" element={<div className="feature-placeholder">Finance & Accounting Module</div>} />
          <Route path="/settings" element={<div className="feature-placeholder">Farm Settings</div>} />
          <Route path="/workers/logs" element={<LaborLogs />} />
        </Routes>
      </Shell>
    </Router>
  );
}

export default App;
