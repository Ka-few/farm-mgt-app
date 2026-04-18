import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Shell from "./components/Shell";
import Dashboard from "./modules/farm/Dashboard";
import Crops from "./modules/crops/Crops";
import Livestock from "./modules/livestock/Livestock";
import Finance from "./modules/finance/Finance";
import FarmSetup from "./modules/farm/FarmSetup";
import Workers from "./modules/workers/Workers";
import LaborLogs from "./modules/workers/LaborLogs";
import Irrigation from "./modules/crops/Irrigation";
import Reports from "./modules/reports/Reports";
import Customers from "./modules/customers/Customers";

import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <ToastProvider>
      <Router>
        <Shell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/crops" element={<Crops />} />
            <Route path="/livestock" element={<Livestock />} />
            <Route path="/irrigation" element={<Irrigation />} />
            <Route path="/workers" element={<Workers />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/crm" element={<Customers />} />
            <Route path="/settings" element={<FarmSetup />} />
            <Route path="/workers/logs" element={<LaborLogs />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Shell>
      </Router>
    </ToastProvider>
  );
}

export default App;
