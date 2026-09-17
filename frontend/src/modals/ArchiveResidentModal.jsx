// ArchiveResidentModal.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import ArchiveIcon from "@mui/icons-material/Archive";
import axios from "axios";

/**
 * Replaces the old DeleteResidentModal — residents are never hard-deleted
 * anymore, only archived. Archiving hides a resident from the active list
 * and excludes them from eligibility qualification, but an Admin can
 * restore them later from the Archived Residents page. There is no
 * permanent-delete path for residents at all.
 */
const ArchiveResidentModal = ({ open, onClose, onConfirm, target }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleArchive = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const residentId = target?.id || target?.resident_id;
      if (!residentId) throw new Error("Missing resident id");

      await axios.put(
        `http://localhost:5000/api/residents/archive/${residentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onConfirm?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to archive resident. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          px: 2,
        },
      }}
    >
      <DialogContent sx={{ pt: 4 }}>
        <Stack spacing={2.5} alignItems="center">
          {/* Icon — same stone/grey treatment as the Eligibility Form
              archive modal, for a consistent "this is a soft, reversible
              action" visual language across the app. */}
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              bgcolor: "#f5f5f4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArchiveIcon sx={{ fontSize: 36, color: "#78716c" }} />
          </Box>

          <Typography variant="h6" fontWeight={600}>
            Archive Resident?
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ maxWidth: 280 }}
          >
            <strong>{target?.fullName}</strong> will be moved to the archive.
            They will be hidden from the active resident list and excluded
            from eligibility qualification, but an admin can restore them
            later.
          </Typography>

          {error && (
            <Typography color="error" variant="body2" align="center">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 3, gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleArchive}
          disabled={loading}
          sx={{
            minWidth: 110,
            backgroundColor: "#78716c",
            "&:hover": { backgroundColor: "#57534e" },
            textTransform: "none",
          }}
        >
          {loading ? "Archiving..." : "Archive"}
        </Button>

        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={loading}
          sx={{ minWidth: 100, textTransform: "none" }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArchiveResidentModal;