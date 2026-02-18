// AddHouseholdModal.jsx 
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
} from "@mui/material";
import axios from "axios";

const AddHouseholdModal = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    f_name: "",
    m_name: "",
    l_name: "",
    suffix: "",
    house_no: "",
    street: "",
    head_count: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!formData.f_name || !formData.l_name || !formData.house_no || !formData.street || !formData.head_count) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in again.");
        return;
      }

      const payload = formData;

      const res = await axios.post("http://localhost:5000/api/households/add", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(res.data.message || "Household added successfully!");

      // Clear form
      setFormData({
        f_name: "",
        m_name: "",
        l_name: "",
        suffix: "",
        house_no: "",
        street: "",
        head_count: "",
      });

      onSuccess?.();
    } catch (err) {
      console.error("Add household error:", err);
      setError(err.response?.data?.message || "Failed to add household. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: "#e0e0e0", pb: 1 }}>
        Add New Household
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 3 }}>
        <Stack spacing={2.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 1 }}>
            Fill in the blanks
          </Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              label="First Name *"
              name="f_name"
              value={formData.f_name}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Middle Name"
              name="m_name"
              value={formData.m_name}
              onChange={handleChange}
              fullWidth
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Last Name *"
              name="l_name"
              value={formData.l_name}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Suffix (Jr, Sr, etc.)"
              name="suffix"
              value={formData.suffix}
              onChange={handleChange}
              fullWidth
            />
          </Stack>

          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 2 }}>
            Address
          </Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              label="House No. / Block / Lot"
              name="house_no"
              value={formData.house_no}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Street *"
              name="street"
              value={formData.street}
              onChange={handleChange}
              fullWidth
              required
            />
          </Stack>

          {/* ✅ Added missing head_count field */}
          <TextField
            label="Head Count *"
            name="head_count"
            value={formData.head_count}
            onChange={handleChange}
            fullWidth
            required
            type="number"
          />

          {error && <Typography color="error" mt={2}>{error}</Typography>}
          {success && <Typography color="success.main" mt={2}>{success}</Typography>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          sx={{ backgroundColor: "#002f59" }}
        >
          {loading ? "Saving..." : "Add Household"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddHouseholdModal;