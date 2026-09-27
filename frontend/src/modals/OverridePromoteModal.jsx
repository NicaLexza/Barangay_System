
import React, { useState, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Box, TextField, Alert,
  Autocomplete, InputAdornment, IconButton, CircularProgress,
} from "@mui/material";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import LockIcon from "@mui/icons-material/Lock";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import axios from "axios";

/**
 * OverridePromoteModal — Admin-gated swap: promotes a specific Waitlisted
 * entry to Selected by replacing a currently Selected entry. Always requires
 * Admin re-auth and a written reason.
 *
 * Props:
 *  - open, onClose        — standard MUI Dialog control
 *  - onConfirm            — called after success (triggers grid refresh)
 *  - target               — the waitlisted row to promote (needs entry_id, fullName, rank_no)
 *  - selectedEntries      — array of currently Selected rows (each needs entry_id, fullName)
 */
const OverridePromoteModal = ({ open, onClose, onConfirm, target, selectedEntries = [] }) => {
  const [replaceEntry, setReplaceEntry] = useState(null);
  const [reason, setReason] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const options = useMemo(
    () => selectedEntries.map((e) => ({ id: e.entry_id, label: e.fullName || `Entry #${e.entry_id}` })),
    [selectedEntries]
  );

  const handleClose = () => {
    if (loading) return;
    setReplaceEntry(null);
    setReason("");
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setError("");
    setResult(null);
    onClose?.();
  };

  const canSubmit = replaceEntry && reason.trim() && username.trim() && password;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://localhost:5000/api/eligibility-forms/entries/${target.entry_id}/override-promote`,
        {
          replace_entry_id: replaceEntry.id,
          reason: reason.trim(),
          username: username.trim(),
          password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(res.data);
      onConfirm?.();
    } catch (err) {
      setError(err.response?.data?.message || "Override failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  // ── Success state ──────────────────────────────────────────────────────
  if (result) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, px: 2 } }}
      >
        <DialogContent sx={{ pt: 4 }}>
          <Stack spacing={2} alignItems="center">
            <Box
              sx={{
                width: 72, height: 72, borderRadius: "50%", bgcolor: "#e8f5e9",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <SwapHorizRoundedIcon sx={{ fontSize: 36, color: "#2e7d32" }} />
            </Box>
            <Typography variant="h6" fontWeight={600} textAlign="center">
              Override Complete
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 300 }}>
              {result.message}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button variant="contained" onClick={handleClose} sx={{ minWidth: 100, backgroundColor: "#002f59" }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, px: 1 } }}
    >
      <DialogTitle sx={{ pt: 3, pb: 1, fontWeight: 700, fontSize: "1.05rem", color: "#002f59" }}>
        Override Promote
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Promote <strong>{target?.fullName}</strong>
          {target?.rank_no != null ? ` (rank #${target.rank_no})` : ""} to
          Selected by replacing a currently selected entry. This action requires
          admin credentials and a reason.
        </Typography>

        <Stack spacing={2.5}>
          {/* Who to replace */}
          <Autocomplete
            options={options}
            value={replaceEntry}
            onChange={(_, val) => { setReplaceEntry(val); setError(""); }}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Replace which selected entry?"
                placeholder="Search by name…"
                size="small"
                required
              />
            )}
            noOptionsText="No selected entries"
          />

          {/* Reason */}
          <TextField
            label="Reason for override"
            placeholder="e.g. Emergency case, Barangay captain directive…"
            multiline
            minRows={2}
            maxRows={4}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(""); }}
            fullWidth
            required
            size="small"
          />

          {/* Admin re-auth */}
          <Box sx={{ borderTop: "1px solid #e2e8f0", pt: 2 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", mb: 1.5 }}>
              Admin Verification
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                fullWidth
                size="small"
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
            </Stack>
          </Box>

          {error && (
            <Alert severity="error">{error}</Alert>
          )}
        </Stack>
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
          onClick={handleSubmit}
          disabled={loading || !canSubmit}
          sx={{
            textTransform: "none",
            minWidth: 120,
            backgroundColor: "#002f59",
            "&:hover": { backgroundColor: "#001c38" },
          }}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {loading ? "Processing..." : "Confirm Override"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OverridePromoteModal;
