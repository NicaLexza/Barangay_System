// DeleteEligibilityFormModal.jsx
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
 * Soft-deletes the form by setting its status to 'Archived'.
 * The backend DELETE endpoint now performs a soft-delete (status = 'Archived')
 * so this modal's HTTP call remains the same.
 */
const DeleteEligibilityFormModal = ({ open, onClose, onConfirm, target }) => {
  const [loading, setLoading] = useState(false);

  const handleArchive = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formId = target?.form_id;
      if (!formId) throw new Error("Missing form id");

      await axios.delete(
        `http://localhost:5000/api/eligibility-forms/delete/${formId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      onConfirm?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      onClose?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          {/* Icon */}
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

          {/* Title */}
          <Typography variant="h6" fontWeight={600}>
            Archive Form?
          </Typography>

          {/* Message */}
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ maxWidth: 280 }}
          >
            <strong>{target?.form_name}</strong> will be moved to the archive.
            It will become read-only and can be restored later by an admin.
          </Typography>
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
          onClick={onClose}
          disabled={loading}
          sx={{ minWidth: 100, textTransform: "none" }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteEligibilityFormModal;