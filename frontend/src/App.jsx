import{ BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts.jsx";
import Residents from "./pages/Residents.jsx";
import Eligibility from "./pages/Eligibility.jsx";

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