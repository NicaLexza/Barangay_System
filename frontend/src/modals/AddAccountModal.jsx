import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, MenuItem, Typography,
} from "@mui/material";
import axios from "axios";

const AddAccountModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    role: "Staff",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

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

      setSuccess(res.data.message || "Account created successfully!");

      setFormData({ fullname: "", username: "", role: "Staff" });
      onSuccess?.();
    } catch (err) {
      console.error("Add account error:", err);
      setError(err.response?.data?.message || "Failed to add account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ fullname: "", username: "", role: "Staff" });
    setError("");
    setSuccess("");
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
          {success && <Typography color="success.main" mt={2}>{success}</Typography>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
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