// modals/ActionAuthModal.jsx
//
// Credential prompt for Enable / Disable / Archive / Edit-details on
// eligibility forms. Differs from ReAuthModal in three ways:
//   1. It owns the submit: `onSubmit` performs the request and THROWS on
//      failure, so this modal can tell a credential rejection (401) from any
//      other error and count only the former toward the lockout.
//   2. Staff see "Administrator" wording — they must enter an admin's
//      credentials, not their own.
//   3. Optionally collects a new end date (re-enabling an expired form).
//
// Lockout: 5 failed credential attempts disable submitting for 60 seconds.
// This is a UI-side throttle only (component state, reset whenever the
// modal is reopened) — it slows guessing through this dialog but is not a
// server-enforced lockout.
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;

const getRoleFromToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1])).role ?? null;
  } catch {
    return null;
  }
};

/**
 * Props:
 *   open, onClose
 *   onSubmit({ username, password, end_date? }) — async; must throw on failure
 *                and resolve on success (the parent closes the modal itself)
 *   title, description, confirmLabel, confirmColor
 *   requireEndDate — show + require a new end date
 *   minEndDate     — dayjs; earliest selectable end date (defaults to today)
 */
const ActionAuthModal = ({
  open,
  onClose,
  onSubmit,
  title = "Confirm Action",
  description = "",
  confirmLabel = "Confirm",
  confirmColor = "primary",
  requireEndDate = false,
  minEndDate = null,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const isStaff = getRoleFromToken() === "Staff";
  const locked = secondsLeft > 0;

  // Fresh state every time the dialog opens (this also resets the lockout).
  useEffect(() => {
    if (open) {
      setUsername("");
      setPassword("");
      setShowPassword(false);
      setEndDate(null);
      setError("");
      setLoading(false);
      setFailedAttempts(0);
      setSecondsLeft(0);
    }
  }, [open]);

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const dateOk = !requireEndDate || (endDate && endDate.isValid());
  const canSubmit = username.trim() && password && dateOk && !locked && !loading;

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      await onSubmit({
        username: username.trim(),
        password,
        end_date: requireEndDate ? endDate.format("YYYY-MM-DD") : undefined,
      });
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || "Something went wrong. Please try again.";
      setPassword("");

      if (status === 401) {
        const next = failedAttempts + 1;
        if (next >= MAX_ATTEMPTS) {
          setFailedAttempts(0);
          setSecondsLeft(LOCK_SECONDS);
          setError("");
        } else {
          setFailedAttempts(next);
          const left = MAX_ATTEMPTS - next;
          setError(`${message} ${left} ${left === 1 ? "attempt" : "attempts"} left.`);
        }
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, px: 1 } }}
    >
      <DialogTitle sx={{ pt: 3, pb: 1, fontWeight: 700, fontSize: "1.05rem", color: "#002f59" }}>
        {title}
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>
        )}

        {isStaff && (
          <Alert severity="info" sx={{ mb: 2, fontSize: "0.8rem" }}>
            Your account can't authorize this on its own. Ask an administrator to enter their username and password.
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {requireEndDate && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="New end date *"
                value={endDate}
                onChange={setEndDate}
                format="MM/DD/YYYY"
                minDate={minEndDate || dayjs().startOf("day")}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    helperText: "The end date has passed. Pick a new one to re-enable this form.",
                  },
                }}
              />
            </LocalizationProvider>
          )}

          <TextField
            label={isStaff ? "Administrator username" : "Username"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            size="small"
            autoFocus
            disabled={locked}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PermIdentityIcon sx={{ fontSize: 18, color: "#666" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label={isStaff ? "Administrator password" : "Password"}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            size="small"
            disabled={locked}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ fontSize: 18, color: "#666" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end">
                      {showPassword ? (
                        <VisibilityIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <VisibilityOffIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {locked ? (
          <Typography color="error" variant="body2" sx={{ mt: 1.5, fontSize: "0.8rem" }}>
            Too many failed attempts. Try again in {secondsLeft} {secondsLeft === 1 ? "second" : "seconds"}.
          </Typography>
        ) : (
          error && (
            <Typography color="error" variant="body2" sx={{ mt: 1.5, fontSize: "0.8rem" }}>
              {error}
            </Typography>
          )
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading} sx={{ textTransform: "none", color: "#64748b" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={handleSubmit}
          disabled={!canSubmit}
          sx={{ textTransform: "none", minWidth: 100 }}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {loading ? "Verifying..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActionAuthModal;