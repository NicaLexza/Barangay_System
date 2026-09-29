// EditEligibilityFormModal.jsx
//
// Edits a form's descriptive fields only. Target quantity, distribution
// unit, and criteria are locked because they decided who is in the pool and
// how it was ranked — see updateFormDetails in EligibilityFormController.js.
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import axios from "axios";
import ModalLogoBadge from "../Reusables/ModalLogoBadge.jsx";

const EditEligibilityFormModal = ({ open, onClose, onSuccess, target }) => {
  const [details, setDetails] = useState({
    form_name: "",
    source_details: "",
    distribution_details: "",
  });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Re-seed from the selected form every time the dialog opens.
  useEffect(() => {
    if (open && target) {
      setDetails({
        form_name: target.form_name || "",
        source_details: target.source_details || "",
        distribution_details: target.distribution_details || "",
      });
      setStartDate(target.start_date ? dayjs(target.start_date) : null);
      setEndDate(target.end_date ? dayjs(target.end_date) : null);
      setError("");
    }
  }, [open, target]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validate = () => {
    if (!details.form_name.trim()) return "Enter a form name.";
    if (details.form_name.trim().length > 150) return "Form name must be 150 characters or fewer.";
    if (!details.source_details.trim()) return "Enter where or who this assistance came from.";
    if (!details.distribution_details.trim()) return "Enter what is being distributed.";
    if (!startDate || !startDate.isValid() || !endDate || !endDate.isValid()) {
      return "Set both a start date and an end date.";
    }
    if (endDate.isBefore(startDate, "day")) return "The end date cannot be before the start date.";
    return "";
  };

  const handleSave = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/eligibility-forms/${target.form_id}/details`,
        {
          form_name: details.form_name.trim(),
          source_details: details.source_details.trim(),
          distribution_details: details.distribution_details.trim(),
          start_date: startDate.format("YYYY-MM-DD"),
          end_date: endDate.format("YYYY-MM-DD"),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update the form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose?.();
  };

  const isDisabled = target?.status === "Disabled";

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: "#e0e0e0", pb: 1.5 }}>
        Edit Form Details
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 3 }}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ fontSize: "0.8rem" }}>
            Target quantity ({target?.target_quantity ?? "—"}), distribution unit (
            {target?.distribution_unit === "Household" ? "per household" : "per resident"}) and who
            qualifies can't be changed after creation, since they decided who is on this form.
          </Alert>

          <TextField
            label="Form name *"
            name="form_name"
            value={details.form_name}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Source or sponsor *"
            name="source_details"
            value={details.source_details}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={2}
          />

          <TextField
            label="What is being distributed *"
            name="distribution_details"
            value={details.distribution_details}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={2}
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction="row" spacing={2}>
              <DatePicker
                label="Start date *"
                value={startDate}
                onChange={(v) => { setStartDate(v); setError(""); }}
                format="MM/DD/YYYY"
                maxDate={endDate || undefined}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DatePicker
                label="End date *"
                value={endDate}
                onChange={(v) => { setEndDate(v); setError(""); }}
                format="MM/DD/YYYY"
                minDate={startDate || undefined}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Stack>
          </LocalizationProvider>

          {isDisabled && (
            <Typography variant="caption" color="text.secondary">
              This form is currently Disabled. Changing the dates won't re-enable it — use Enable from
              the form's menu afterwards if you want it active again.
            </Typography>
          )}

          {error && <Typography color="error">{error}</Typography>}
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
            sx={{ backgroundColor: "#002f59", "&:hover": { backgroundColor: "#001c38" } }}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default EditEligibilityFormModal;