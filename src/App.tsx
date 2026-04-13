import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Shell from "./components/Shell";
import Dashboard from "./modules/farm/Dashboard";
import { useEffect } from "react";
import { initDb } from "./core/db";
import "./styles/theme.css";

import Workers from "./modules/workers/Workers";
import LaborLogs from "./modules/workers/LaborLogs";
import FarmSetup from "./modules/farm/FarmSetup";
import Crops from "./modules/crops/Crops";
import Irrigation from "./modules/crops/Irrigation";
import Finance from "./modules/finance/Finance";
import Livestock from "./modules/livestock/Livestock";
import Reports from "./modules/reports/Reports";

function App() {
  useEffect(() => {
    initDb().catch(console.error);
  }, []);

  return (
    <Router>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/crops" element={<Crops />} />
          <Route path="/livestock" element={<Livestock />} />
          <Route path="/irrigation" element={<Irrigation />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/settings" element={<FarmSetup />} />
          <Route path="/workers/logs" element={<LaborLogs />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Shell>
    </Router>
  );
}

export default App;
