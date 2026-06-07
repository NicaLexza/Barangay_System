// ReAuthModal.jsx
import React, { useState } from "react";
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
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

/**
 * ReAuthModal
 *
 * Props:
 *   open          — boolean
 *   onClose       — called when cancelled or closed
 *   onConfirm     — called with { username, password } after the parent verifies
 *   title         — dialog title string
 *   description   — helper text below the title
 *   confirmLabel  — label for the confirm button (default "Confirm")
 *   confirmColor  — MUI button color (default "primary")
 *   loading       — show spinner on confirm button
 *   error         — error string to display (controlled from parent)
 */
const ReAuthModal = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Your Identity",
  description = "Please enter your credentials to continue.",
  confirmLabel = "Confirm",
  confirmColor = "primary",
  loading = false,
  error = "",
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleClose = () => {
    setUsername("");
    setPassword("");
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!username.trim() || !password) return;
    onConfirm({ username: username.trim(), password });
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
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {description}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            size="small"
            autoFocus
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
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ fontSize: 18, color: "#666" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                    >
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

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1.5, fontSize: "0.8rem" }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ textTransform: "none", color: "#64748b" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={handleSubmit}
          disabled={loading || !username.trim() || !password}
          sx={{ textTransform: "none", minWidth: 100 }}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {loading ? "Verifying..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReAuthModal;