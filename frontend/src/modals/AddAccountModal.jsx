import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, MenuItem, Typography, Box,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import axios from "axios";

const AddAccountModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    role: "Staff",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Editing the form again means they're starting a new entry —
    // clear out the previous temp password so it isn't mistaken for the new one.
    if (tempPassword) {
      setTempPassword(null);
      setCopied(false);
    }
  };

  const handleSave = async () => {
    setError("");

    if (!formData.fullname || !formData.username) {
      setError("Please fill all required fields (marked with *)");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in again.");
        return;
      }

      const res = await axios.post("http://localhost:5000/api/users/add", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTempPassword(res.data.temp_password || null);
      setFormData({ fullname: "", username: "", role: "Staff" });
      onSuccess?.();
    } catch (err) {
      console.error("Add account error:", err);
      setError(err.response?.data?.message || "Failed to add account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — password is still
      // visible on screen and can be selected/copied manually.
    }
  };

  const handleClose = () => {
    setFormData({ fullname: "", username: "", role: "Staff" });
    setError("");
    setTempPassword(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: "#e0e0e0", pb: 1 }}>
        Add New Account
      </DialogTitle>

      <DialogContent sx={{
        px: 4,
        py: 3,
        backgroundImage: "url('BLOGO.png')",
        backgroundSize: "500px 400px",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "rgba(248, 251, 255, 0.85)",
        backgroundBlendMode: "lighten",
      }}>
        <Stack spacing={2.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 1 }}>
            Account Information
          </Typography>

          <TextField
            label="Full Name *"
            name="fullname"
            value={formData.fullname}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label="Username *"
            name="username"
            value={formData.username}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            fullWidth
          >
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Staff">Staff</MenuItem>
          </TextField>

          {error && <Typography color="error" mt={2}>{error}</Typography>}

          {tempPassword && (
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                backgroundColor: "#e8f5e9",
                border: "1px solid #a5d6a7",
              }}
            >
              <Typography variant="body2" color="success.main" fontWeight={600} mb={1}>
                Account created successfully
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Temporary password — share this with the new user now. It will not be shown again.
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    backgroundColor: "white",
                    border: "1px solid #c8e6c9",
                    borderRadius: 1,
                    px: 1.5,
                    py: 0.5,
                    flex: 1,
                  }}
                >
                  {tempPassword}
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ContentCopyIcon fontSize="small" />}
                  onClick={handleCopyPassword}
                  sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          {tempPassword ? "Close" : "Cancel"}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          sx={{ backgroundColor: "#002f59" }}
        >
          {loading ? "Saving..." : "Add Account"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAccountModal;