import{ BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/LoginPage.jsx";
import Dashboard from "./pages/DashboardPage.jsx";
import Accounts from "./pages/AccountsPage.jsx";
import Residents from "./pages/Residents/ResidentsPage.jsx";
import Eligibility from "./pages/EligibilityPage.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Dashboard" element={<Dashboard />}/>
        <Route path="/Accounts" element={<Accounts />} />
        <Route path="/Residents" element={<Residents />} />
        <Route path="/Eligibility" element={<Eligibility />} 
        
        />
      </Routes>
    </Router>
  );
};

export default App;