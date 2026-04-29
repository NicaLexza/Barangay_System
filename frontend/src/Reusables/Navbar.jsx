// Navbar.jsx
import { useState, useEffect, useRef } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Dialog,
  Typography,
  Tooltip,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";

const IDLE_LIMIT_MS = 1 * 60 * 1000; // 1 minute
const WARNING_SECONDS = 30;

/** Decode JWT payload for role — no signature verification (UI-only). */
const getRoleFromToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).role ?? null;
  } catch {
    return null;
  }
};

const Navbar = () => {
  const location = useLocation();
  const mainColor = "#002f59be";
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);
  const navigate = useNavigate();

  const role = getRoleFromToken();
  const isAdmin = role === "Admin";

  const idleTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    setLogoutDialogOpen(false);
    setWarningOpen(false);
    clearTimeout(idleTimerRef.current);
    clearInterval(countdownRef.current);
    navigate("/");
  };

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningOpen) return;
    idleTimerRef.current = setTimeout(() => {
      setWarningOpen(true);
      setSecondsLeft(WARNING_SECONDS);
    }, IDLE_LIMIT_MS);
  };

  const handleStayLoggedIn = () => {
    setWarningOpen(false);
    clearCountdown();
    setSecondsLeft(WARNING_SECONDS);
    resetIdleTimer();
  };

  useEffect(() => {
    if (!warningOpen) { clearCountdown(); return; }
    setSecondsLeft(WARNING_SECONDS);
    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearCountdown();
  }, [warningOpen]);

  useEffect(() => {
    if (warningOpen && secondsLeft <= 0) logout();
  }, [warningOpen, secondsLeft]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    const handler = () => { if (!warningOpen) resetIdleTimer(); };
    events.forEach((e) => window.addEventListener(e, handler));
    resetIdleTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      clearTimeout(idleTimerRef.current);
      clearCountdown();
    };
  }, [warningOpen]);

  // ── Nav items ─────────────────────────────────────────────────────────────
  // Each item may carry `adminOnly: true` to restrict it to Admin users.
  const navItems = [
    { label: "Dashboard",        path: "/Dashboard",  adminOnly: true  },
    { label: "Residents",        path: "/Residents",  adminOnly: false },
    { label: "Accounts",         path: "/Accounts",   adminOnly: true  },
    { label: "Eligibility Forms",path: "/Eligibility",adminOnly: false },
  ];

  return (
    <AppBar
      position="fixed"
      elevation={1}
      sx={{
        backgroundColor: "transparent",
        borderBottom: `2px solid ${mainColor}`,
        zIndex: 1300,
      }}
    >
      <Toolbar>
        {/* Logo */}
        <Box display="flex" alignItems="center">
          <img
            src="/BLOGO.png"
            alt="Barangay Logo"
            style={{ height: 60, width: 70, objectFit: "contain", marginRight: 8, padding: 1.5 }}
          />
        </Box>

        {/* Nav buttons */}
        <Box display="flex" gap={3} mx="auto" sx={{ width: "600px" }}>
          {navItems.map((item) => {
            const isActive    = location.pathname === item.path;
            const isLocked    = item.adminOnly && !isAdmin; // Staff trying admin route

            const btn = (
              <Button
                key={item.path}
                // When locked: render as a plain div-like button (no routing)
                component={isLocked ? "button" : Link}
                to={isLocked ? undefined : item.path}
                disabled={isLocked}
                sx={{
                  flex: 1,
                  height: 48,
                  color: isLocked
                    ? "#9e9e9e"
                    : isActive
                    ? "#fff"
                    : mainColor,
                  border: `2px solid ${isLocked ? "#9e9e9e" : mainColor}`,
                  backgroundColor: isLocked
                    ? "rgba(0,0,0,0.04)"
                    : isActive
                    ? mainColor
                    : "transparent",
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 500,
                  cursor: isLocked ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  // Disable MUI's own disabled pointer-events override so
                  // the Tooltip can still fire on the wrapper
                  "&.Mui-disabled": {
                    pointerEvents: "auto",
                    opacity: 0.5,
                  },
                  "&:hover": isLocked
                    ? {}
                    : {
                        backgroundColor: isActive ? mainColor : `${mainColor}22`,
                        color: "#000000",
                        transform: "translateY(-3px)",
                        boxShadow: `0 6px 12px ${mainColor}33`,
                      },
                }}
              >
                {item.label}
              </Button>
            );

            // Wrap locked buttons in a Tooltip so Staff understand why it's greyed out
            return isLocked ? (
              <Tooltip
                key={item.path}
                title="Admin access only"
                placement="bottom"
                arrow
              >
                {/* span needed because Tooltip requires a non-disabled child */}
                <span style={{ flex: 1, display: "flex" }}>{btn}</span>
              </Tooltip>
            ) : (
              <span key={item.path} style={{ flex: 1, display: "flex" }}>
                {btn}
              </span>
            );
          })}
        </Box>

        {/* Logout */}
        <Box>
          <Button
            onClick={() => setLogoutDialogOpen(true)}
            sx={{
              color: mainColor,
              border: `1px solid ${mainColor}`,
              borderRadius: 1,
              textTransform: "none",
              backgroundColor: "#F26076",
              "&:hover": { backgroundColor: `${mainColor}33` },
            }}
          >
            Logout
          </Button>

          {/* Logout confirmation dialog */}
          <Dialog
            open={logoutDialogOpen}
            onClose={() => setLogoutDialogOpen(false)}
            PaperProps={{ sx: { borderRadius: 3, padding: 3, textAlign: "center", width: 360 } }}
          >
            <Box
              sx={{
                width: 64, height: 64, borderRadius: "50%", backgroundColor: "#e3edf6",
                display: "flex", alignItems: "center", justifyContent: "center",
                mx: "auto", mb: 2,
              }}
            >
              <LogoutIcon sx={{ fontSize: 32, color: "#002f59be" }} />
            </Box>
            <Typography variant="h6" fontWeight={600} mb={1}>Logout</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Are you sure you want to logout?
            </Typography>
            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                variant="contained"
                sx={{ width: 110, textTransform: "none", borderRadius: 2, backgroundColor: "#4b6e8d", "&:hover": { backgroundColor: "#3f5f7a" } }}
                onClick={logout}
              >
                Logout
              </Button>
              <Button variant="outlined" onClick={() => setLogoutDialogOpen(false)} sx={{ width: 110, textTransform: "none", borderRadius: 2 }}>
                Cancel
              </Button>
            </Box>
          </Dialog>

          {/* Idle warning dialog */}
          <Dialog
            open={warningOpen}
            PaperProps={{ sx: { borderRadius: 3, padding: 3, textAlign: "center", width: 400, backgroundColor: "#1d1a1a", color: "#fff" } }}
          >
            <Typography variant="h5" fontWeight={700} color="#ff6464" mb={1}>
              Session Expiration Warning
            </Typography>
            <Typography variant="body1" mb={2}>
              Your session will expire due to inactivity. Please choose an action before the timer runs out.
            </Typography>
            <Typography variant="h3" fontWeight={600} mb={2} fontSize="1.25rem">
              {secondsLeft} second{secondsLeft === 1 ? "" : "s"} remaining
            </Typography>
            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                variant="outlined"
                onClick={handleStayLoggedIn}
                sx={{ width: 140, color: "#fff", borderColor: "#fff", textTransform: "none" }}
              >
                Stay logged in
              </Button>
              <Button
                variant="contained"
                onClick={logout}
                sx={{ width: 140, backgroundColor: "#fa1034", textTransform: "none", "&:hover": { backgroundColor: "#f85a5a" } }}
              >
                Logout now
              </Button>
            </Box>
          </Dialog>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;