// AddEligibilityFormModal.jsx
import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, Typography,
} from "@mui/material";
import axios from "axios";

const AddEligibilityFormModal = ({ open, onClose, onSuccess, filteredRows, type = "resident" }) => {
  const [formData, setFormData] = useState({ form_name: "" });
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

    if (!formData.form_name) {
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

      const ids = filteredRows.map((row) => row.id);

      // ✅ send the right key depending on which page triggered the modal
      const payload = {
        form_name: formData.form_name,
        ...(type === "household"
          ? { household_ids: ids }
          : { resident_ids: ids }),
      };

      const res = await axios.post(
        "http://localhost:5000/api/eligibility-forms",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(res.data.message || "Eligibility form created successfully!");
      setFormData({ form_name: "" });
      onSuccess?.();
    } catch (err) {
      console.error("Create eligibility form error:", err);
      setError(err.response?.data?.message || "Failed to create eligibility form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ form_name: "" });
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: "#e0e0e0", pb: 1 }}>
        Create Eligibility Form
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 3 }}>
        <Stack spacing={2.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 1 }}>
            Current records will be selected
          </Typography>

          <TextField
            label="Form Name *"
            name="form_name"
            value={formData.form_name}
            onChange={handleChange}
            fullWidth
            required
          />

          {error && <Typography color="error">{error}</Typography>}
          {success && <Typography color="success.main">{success}</Typography>}
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
          {loading ? "Creating..." : "Create Form"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEligibilityFormModal;