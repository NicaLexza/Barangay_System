
import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogActions,
  Button, Stack, Typography, Box, TextField, Alert,
} from "@mui/material";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import axios from "axios";

/**
 * RemoveEligibilityFormEntryModal — replaces the old hard-delete modal.
 *
 * Instead of permanently deleting the entry, this sets selection_status
 * to 'Removed' with a required reason (stored in selection_note). The
 * backend also auto-promotes the next-ranked Waitlisted entry (if any)
 * within the same transaction.
 *
 * Props:
 *  - open, onClose  — standard MUI Dialog control
 *  - onConfirm      — called after a successful remove (triggers a grid refresh)
 *  - target         — the row object from the DataGrid (needs entry_id, fullName)
 */
const RemoveEligibilityFormEntryModal = ({ open, onClose, onConfirm, target }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  React.useEffect(() => {
    if (open) {
      if (target?.resident_is_archived) {
        setReason("Resident record was archived in barangay records");
      } else {
        setReason("");
      }
      setError("");
      setResult(null);
    }
  }, [open, target]);

  const handleClose = () => {
    if (loading) return;
    setReason("");
    setError("");
    setResult(null);
    onClose?.();
  };

  const handleRemove = async () => {
    if (!reason.trim()) {
      setError("A reason for removal is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const entryId = target?.entry_id;
      if (!entryId) throw new Error("Missing entry id");

      const res = await axios.put(
        `http://localhost:5000/api/eligibility-forms/entries/${entryId}/remove`,
        { reason: reason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(res.data);
      onConfirm?.();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to remove entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // After a successful remove, show a confirmation before closing.
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
              <RemoveCircleOutlineRoundedIcon sx={{ fontSize: 36, color: "#2e7d32" }} />
            </Box>

            <Typography variant="h6" fontWeight={600} textAlign="center">
              Entry Removed
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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, px: 2 } }}
    >
      <DialogContent sx={{ pt: 4 }}>
        <Stack spacing={2.5} alignItems="center">
          <Box
            sx={{
              width: 72, height: 72, borderRadius: "50%", bgcolor: "#fff3e0",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <RemoveCircleOutlineRoundedIcon sx={{ fontSize: 36, color: "#e65100" }} />
          </Box>

          <Typography variant="h6" fontWeight={600}>Remove Entry?</Typography>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 300 }}>
            <strong>{target?.fullName}</strong> will be removed from the Selected
            list. If there are waitlisted entries, the next in rank will be
            automatically promoted.
          </Typography>

          {target?.resident_is_archived && (
            <Alert severity="warning" sx={{ width: "100%", fontSize: "0.82rem" }}>
              This resident has been archived in system records and cannot receive goods. Removing them will promote the next eligible waitlisted resident.
            </Alert>
          )}

          <TextField
            label="Reason for removal"
            placeholder="e.g. Relocated, Declined, Duplicate entry…"
            multiline
            minRows={2}
            maxRows={4}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(""); }}
            fullWidth
            required
            error={Boolean(error)}
            autoFocus
          />

          {error && (
            <Alert severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 3, gap: 2 }}>
        <Button
          variant="contained"
          color="error"
          onClick={handleRemove}
          disabled={loading || !reason.trim()}
          sx={{ minWidth: 100 }}
        >
          {loading ? "Removing..." : "Remove"}
        </Button>
        <Button variant="outlined" onClick={handleClose} disabled={loading} sx={{ minWidth: 100 }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemoveEligibilityFormEntryModal;
