// AddEligibilityFormModal.jsx
import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, Typography, Box,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import axios from "axios";
import ModalLogoBadge from "../Reusables/ModalLogoBadge.jsx";

const AddEligibilityFormModal = ({ open, onClose, onSuccess, filteredRows }) => {
  const [formData, setFormData] = useState({
    form_name: "",
    source_details: "",
    distribution_details: "",
    target_quantity: "",
  });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
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
    if (!formData.source_details.trim()) {
      setError("Please specify where/who this ayuda came from.");
      return;
    }
    if (!formData.distribution_details.trim()) {
      setError("Please specify what is being distributed.");
      return;
    }
    const quantity = Number(formData.target_quantity);
    if (!formData.target_quantity || !Number.isInteger(quantity) || quantity < 1) {
      setError("Target quantity must be a whole number of at least 1.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please set both a start date and an end date.");
      return;
    }
    if (endDate.isBefore(startDate, "day")) {
      setError("End date cannot be before the start date.");
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

      const payload = {
        form_name: formData.form_name,
        source_details: formData.source_details.trim(),
        distribution_details: formData.distribution_details.trim(),
        target_quantity: quantity,
        start_date: startDate.format("YYYY-MM-DD"),
        end_date: endDate.format("YYYY-MM-DD"),
        resident_ids: ids,
      };

      const res = await axios.post(
        "http://localhost:5000/api/eligibility-forms",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(res.data.message || "Eligibility form created successfully!");
      setFormData({ form_name: "", source_details: "", distribution_details: "", target_quantity: "" });
      setStartDate(null);
      setEndDate(null);
      onSuccess?.();
    } catch (err) {
      console.error("Create eligibility form error:", err);
      setError(err.response?.data?.message || "Failed to create eligibility form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ form_name: "", source_details: "", distribution_details: "", target_quantity: "" });
    setStartDate(null);
    setEndDate(null);
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

          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 1 }}>
            Additional Details
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
            This information is recorded for accountability, since this form is tied to actual assistance being distributed.
          </Typography>

          <TextField
            label="Source / Sponsor *"
            name="source_details"
            value={formData.source_details}
            onChange={handleChange}
            fullWidth
            required
            multiline
            minRows={2}
            placeholder="Where or who this ayuda came from (e.g. DSWD, LGU Manila, private donor)"
          />

          <TextField
            label="What is being distributed *"
            name="distribution_details"
            value={formData.distribution_details}
            onChange={handleChange}
            fullWidth
            required
            multiline
            minRows={2}
            placeholder="e.g. ₱1,000 cash assistance, relief goods package"
          />

          <TextField
            label="Target Quantity *"
            name="target_quantity"
            type="number"
            value={formData.target_quantity}
            onChange={handleChange}
            fullWidth
            required
            inputProps={{ min: 1 }}
            helperText="How many will be given. Recorded for reporting — the system does not yet enforce this as a hard cap."
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Start Date *"
                value={startDate}
                onChange={setStartDate}
                format="MM/DD/YYYY"
                maxDate={endDate || undefined}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
              <DatePicker
                label="End Date *"
                value={endDate}
                onChange={setEndDate}
                format="MM/DD/YYYY"
                minDate={startDate || undefined}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Stack>
          </LocalizationProvider>
          <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
            This form will automatically lock (become Disabled) once the end date passes.
          </Typography>

          {error && <Typography color="error">{error}</Typography>}
          {success && <Typography color="success.main">{success}</Typography>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, justifyContent: "space-between", alignItems: "center" }}>
        <ModalLogoBadge />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            sx={{ backgroundColor: "#002f59" }}
          >
            {loading ? "Creating..." : "Create Form"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AddEligibilityFormModal;