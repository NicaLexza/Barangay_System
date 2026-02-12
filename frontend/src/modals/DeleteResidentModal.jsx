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
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import axios from "axios";

const DeleteResidentModal = ({ open, onClose, onConfirm, target }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const residentId = target?.id || target?.resident_id;
      if (!residentId) throw new Error("Missing resident id");

      await axios.delete(
        `http://localhost:5000/api/residents/delete/${residentId}`,
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
              bgcolor: "#fdecea",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 36, color: "#e53935" }} />
          </Box>

          {/* Title */}
          <Typography variant="h6" fontWeight={600}>
            Delete Record?
          </Typography>

          {/* Message */}
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ maxWidth: 260 }}
          >
            Are you sure you want to delete this record? This action{" "}
            <strong>cannot</strong> be undone.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 3, gap: 2 }}>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          {loading ? "Deleting..." : "Delete"}
        </Button>

        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          Back
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteResidentModal;