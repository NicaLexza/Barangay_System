// ResetPasswordModal.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import axios from "axios";
import ModalLogoBadge from "../Reusables/ModalLogoBadge.jsx";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const ResetPasswordModal = ({ open, onClose, userId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

  const handleReset = async () => {
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in again.");
        return;
      }

      const res = await axios.put(
        `http://localhost:5000/api/users/${userId}/password`,
        {}, // No body needed for reset
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTempPassword(res.data.temp_password || "123456");
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    setSuccess(false);
    setTempPassword("");
    onClose();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tempPassword);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: "#e0e0e0", pb: 1 }}>
        Reset Password
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 3 }}>
        {!success ? (
          <Box>
            <Typography variant="body1" sx={{ color: "#333", mb: 2 }}>
              Are you sure you want to reset the password for this account? 
            </Typography>
            <Typography variant="body2" sx={{ color: "#666" }}>
              This will generate a secure temporary password and force the user to change their password upon their next login.
            </Typography>
            {error && <Typography color="error" mt={2}>{error}</Typography>}
          </Box>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Password has been successfully reset!
            </Alert>
            <Typography variant="body2" sx={{ mb: 1, color: "#666" }}>
              The account's temporary password is:
            </Typography>
            <Box 
              sx={{ 
                p: 2, 
                backgroundColor: "#f5f5f5", 
                borderRadius: "4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #e0e0e0"
              }}
            >
              <Typography variant="h6" sx={{ letterSpacing: "2px", fontWeight: "bold" }}>
                {tempPassword}
              </Typography>
              <Button 
                size="small" 
                startIcon={<ContentCopyIcon />}
                onClick={copyToClipboard}
              >
                Copy
              </Button>
            </Box>
            <Typography variant="caption" sx={{ display: "block", mt: 2, color: "#888" }}>
              The user will be prompted to change this password when they next log in.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, justifyContent: "space-between", alignItems: "center" }}>
        <ModalLogoBadge />
        <Box sx={{ display: "flex", gap: 1 }}>
          {!success ? (
            <>
              <Button onClick={handleClose} disabled={loading}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleReset}
                disabled={loading}
                sx={{ backgroundColor: "#002f59" }}
              >
                {loading ? "Resetting..." : "Confirm Reset"}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} variant="contained" sx={{ backgroundColor: "#002f59" }}>
              Close
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ResetPasswordModal;
