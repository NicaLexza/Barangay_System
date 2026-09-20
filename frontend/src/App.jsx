import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/LoginPage.jsx";
import Dashboard from "./pages/DashboardPage.jsx";
import Accounts from "./pages/Accounts/AccountsPage.jsx";
import Residents from "./pages/Residents/ResidentsPage.jsx";
import ResidentsArchivedPage from "./pages/ArchivedResidents/ResidentsArchivedPage.jsx";
import Eligibility from "./pages/EligibilityForm/EligibilityPage.jsx";
import EligibilityEntries from "./pages/EligibilityForm/EligibilityEntriesPage.jsx";
import EligibilityArchivedPage from "./pages/EligibilityForm/EligibilityArchivedPage.jsx";
import ChangePassword from "./pages/ChangePasswordPage.jsx";
import AuditLogs from "./pages/AuditLogs/AuditLogsPage.jsx";
import ProtectedRoute from "./Reusables/ProtectedRoute.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public — login only */}
        <Route path="/" element={<Login />} />

        {/* Forced password change — authenticated, any role */}
        <Route
          path="/ChangePassword"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          path="/Dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Accounts"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Accounts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/AuditLogs"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        {/* Shared routes — Admin and Staff */}
        <Route
          path="/Residents"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Staff"]}>
              <Residents />
            </ProtectedRoute>
          }
        />
        {/* NOTE: /Residents/Archived must be declared BEFORE any future
            /Residents/:id-style route, same reasoning as Eligibility's
            Archived route below — Residents has no such :id route today,
            but this ordering keeps the pattern safe if one is ever added. */}
        <Route
          path="/Residents/Archived"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Staff"]}>
              <ResidentsArchivedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Eligibility"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Staff"]}>
              <Eligibility />
            </ProtectedRoute>
          }
        />
        {/* NOTE: /Eligibility/Archived must be declared BEFORE /Eligibility/:formId
            so React Router does not treat "Archived" as a formId param */}
        <Route
          path="/Eligibility/Archived"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Staff"]}>
              <EligibilityArchivedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Eligibility/:formId"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Staff"]}>
              <EligibilityEntries />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;