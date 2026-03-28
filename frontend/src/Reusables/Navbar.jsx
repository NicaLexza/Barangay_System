import { useState, useEffect, useRef } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  Dialog,
  Typography,
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";

const IDLE_LIMIT_MS = 1 * 60 * 1000; // 1 minute
const WARNING_SECONDS = 30;

const Navbar = () => {
  const location = useLocation();
  const mainColor = "#002f59be";
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS);
  const navigate = useNavigate();

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

    if (warningOpen) {
      console.debug("Idle timer paused while warning is open");
      return;
    }

    console.debug("Setting idle timer for", IDLE_LIMIT_MS, "ms");

    idleTimerRef.current = setTimeout(() => {
      console.debug("Idle timeout reached, opening warning");
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
    if (!warningOpen) {
      clearCountdown();
      return;
    }

    console.debug("Starting countdown from", secondsLeft);
    setSecondsLeft(WARNING_SECONDS);
    countdownRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        console.debug("Countdown tick", next);
        return next;
      });
    }, 1000);

    return () => {
      clearCountdown();
    };
  }, [warningOpen]);

  useEffect(() => {
    if (warningOpen && secondsLeft <= 0) {
      console.debug("Countdown reached 0, auto-logout");
      logout();
    }
  }, [warningOpen, secondsLeft]);

  useEffect(() => {
    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

    const activityHandler = () => {
      if (!warningOpen) resetIdleTimer();
    };

    activityEvents.forEach((eventName) => window.addEventListener(eventName, activityHandler));
    resetIdleTimer();

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, activityHandler));
      clearTimeout(idleTimerRef.current);
      clearCountdown();
    };
  }, [warningOpen]);

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
        <Box display="flex" alignItems="center">
          <img
            src="/BLOGO.png"
            alt="Barangay Logo"
            style={{
              height: 60,
              width: 70,
              objectFit: "contain",
              marginRight: 8,
              padding: 1.5,
            }}
          />
        </Box>

        <Box display="flex" gap={3} mx="auto" sx={{ width: "600px" }}>
          {[
            { label: "Dashboard", path: "/Dashboard" },
            { label: "Residents", path: "/Residents" },
            { label: "Accounts", path: "/Accounts" },
            { label: "Eligibility Forms", path: "/Eligibility" },
          ].map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                sx={{
                  flex: 1,
                  height: 48,
                  color: isActive ? "#fff" : mainColor,
                  border: `2px solid ${mainColor}`,
                  backgroundColor: isActive ? mainColor : "transparent",
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 500,
                  transition: "all 0.3s ease",
                  "&:hover": {
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
          })}
        </Box>

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

          <Dialog
            open={logoutDialogOpen}
            onClose={() => setLogoutDialogOpen(false)}
            PaperProps={{
              sx: {
                borderRadius: 3,
                padding: 3,
                textAlign: "center",
                width: 360,
              },
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "#e3edf6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <LogoutIcon sx={{ fontSize: 32, color: "#002f59be" }} />
            </Box>
            <Typography variant="h6" fontWeight={600} mb={1}>
              Logout
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Are you sure you want to logout?
            </Typography>
            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                variant="contained"
                sx={{
                  width: 110,
                  textTransform: "none",
                  borderRadius: 2,
                  backgroundColor: "#4b6e8d",
                  "&:hover": {
                    backgroundColor: "#3f5f7a",
                  },
                }}
                onClick={logout}
              >
                Logout
              </Button>

              <Button
                variant="outlined"
                onClick={() => setLogoutDialogOpen(false)}
                sx={{ width: 110, textTransform: "none", borderRadius: 2 }}
              >
                Cancel
              </Button>
            </Box>
          </Dialog>

          <Dialog
            open={warningOpen}
            PaperProps={{
              sx: {
                borderRadius: 3,
                padding: 3,
                textAlign: "center",
                width: 400,
                backgroundColor: "#1d1a1a",
                color: "#fff",
              },
            }}
          >
            <Typography variant="h5" fontWeight={700} color="#ff6464" mb={1}>
              Session Expiration Warning
            </Typography>
            <Typography variant="body1" mb={2}>
              Your session will expire due to inactivity. Please choose an action before the timer runs out.
            </Typography>
            <Typography variant="h3" fontWeight={600} mb={2} fontSize={"1.25rem"}> 
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
                sx={{
                  width: 140,
              backgroundColor: "#fa1034",
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#f85a5a" },
                }}
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
