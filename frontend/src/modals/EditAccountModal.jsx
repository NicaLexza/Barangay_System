// EditAccountModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";
import axios from "axios";
import ModalLogoBadge from "../Reusables/ModalLogoBadge.jsx";

const EditAccountModal = ({ open, onClose, onSuccess, userId }) => {

  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    role: "Staff",
    status: "Active",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch account data when modal opens
  useEffect(() => {
    if (open && userId) {
      const fetchAccount = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            setError("No token found.");
            return;
          }

          const res = await axios.get(`http://localhost:5000/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = res.data;
          setFormData({
            fullname: data.fullname || "",
            username: data.username || "",
            role: data.role || "Staff",
            status: data.status || "Active",
          });
        } catch (err) {
          console.error(err);
          setError("Failed to fetch account data.");
        }
      };

      fetchAccount();
    }
  }, [open, userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async () => {
    setError("");
    setSuccess("");

    if (!formData.fullname || !formData.username || !formData.role || !formData.status) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found.");
        return;
      }

      const payload = { ...formData, user_id: userId };

      const res = await axios.put(`http://localhost:5000/api/users/update/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(res.data.message || "Account updated successfully!");
      onSuccess?.();
    } catch (err) {
      console.error("Update error:", err);
      setError(err.response?.data?.message || "Failed to update account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: "#e0e0e0", pb: 1 }}>
        Edit Account
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 3 }}>
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

          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Role *"
              name="role"
              value={formData.role}
              onChange={handleChange}
              fullWidth
              required
            >
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Staff">Staff</MenuItem>
            </TextField>

            <TextField
              select
              label="Status *"
              name="status"
              value={formData.status}
              onChange={handleChange}
              fullWidth
              required
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Stack>

          {error && <Typography color="error" mt={2}>{error}</Typography>}
          {success && <Typography color="success.main" mt={2}>{success}</Typography>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, justifyContent: "space-between", alignItems: "center" }}>
        <ModalLogoBadge />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={loading}
            sx={{ backgroundColor: "#002f59" }}
          >
            {loading ? "Saving..." : "Update Account"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EditAccountModal;