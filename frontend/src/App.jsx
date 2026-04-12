import{ BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/LoginPage.jsx";
import Dashboard from "./pages/DashboardPage.jsx";
import Accounts from "./pages/Accounts/AccountsPage.jsx";
import Residents from "./pages/Residents/ResidentsPage.jsx";
import Eligibility from "./pages/EligibilityForm/EligibilityPage.jsx";
import Households from "./pages/Households/HouseholdsPage.jsx";
import EligibilityEntries from "./pages/EligibilityForm/EligibilityEntriesPage.jsx";
import ChangePassword from "./pages/ChangePasswordPage.jsx";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Dashboard" element={<Dashboard />}/>
        <Route path="/Accounts" element={<Accounts />} />
        <Route path="/Residents" element={<Residents />} />
        <Route path="/Eligibility" element={<Eligibility />} />
        <Route path="/Households" element={<Households />} />
        <Route path="/Eligibility/:formId" element={<EligibilityEntries />} />
        <Route path="/ChangePassword" element={<ChangePassword />} 


        
        
        />
      </Routes>
    </Router>
  );
};

export default App;