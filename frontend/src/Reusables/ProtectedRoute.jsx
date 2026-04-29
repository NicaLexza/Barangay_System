// src/components/Reusables/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";

/**
 * Decodes the JWT payload (no signature verification — just for UI gating).
 * Real security is enforced server-side via verifyToken middleware.
 */
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

/**
 * ProtectedRoute
 *
 * Props:
 *   children      — the page to render if all checks pass
 *   allowedRoles  — array of roles that may access this route, e.g. ["Admin"]
 *                   omit (or pass undefined) to allow any authenticated user
 *
 * Guard order:
 *   1. No token           → /  (login)
 *   2. Expired / invalid  → /  (login)
 *   3. must_change_password === 1 and NOT already on /ChangePassword
 *                         → /ChangePassword
 *   4. Role not in allowedRoles
 *                         → best default page for that role
 *   5. All clear          → render children
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");

  // ── 1 & 2: token presence + validity ─────────────────────────────────────
  if (!token) {
    return <Navigate to="/" replace />;
  }

  const payload = decodeToken(token);

  if (!payload) {
    // Malformed token — clear storage and send to login
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  // ── Check for token expiry (exp is in seconds) ────────────────────────────
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  // ── 3: forced password change ─────────────────────────────────────────────
  if (
    payload.must_change_password === 1 &&
    location.pathname !== "/ChangePassword"
  ) {
    return <Navigate to="/ChangePassword" replace />;
  }

  // ── 4: role-based access ──────────────────────────────────────────────────
  const role = payload.role;

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to the most appropriate page for this role
    const fallback = role === "Staff" ? "/Residents" : "/";
    return <Navigate to={fallback} replace />;
  }

  // ── 5: all checks passed ──────────────────────────────────────────────────
  return children;
};

export default ProtectedRoute;