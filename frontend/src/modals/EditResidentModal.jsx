// EditResidentModal.jsx
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
  FormControlLabel,
  Checkbox,
  FormGroup,
  Typography,
} from "@mui/material";
import axios from "axios";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

const EditResidentModal = ({ open, onClose, onSuccess, residentId }) => {  // ← change prop to residentId
  const [formData, setFormData] = useState({
    f_name: "",
    m_name: "",
    l_name: "",
    suffix: "",
    sex: "Male",
    birthdate: null,
    birthplace: "",
    house_no: "",
    street: "",
    civil_status: "Single",
    occupation: "",
    citizenship: "Filipino",
    is_pwd: false,
    is_senior: false,
    is_solop: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch full resident details when modal opens
  useEffect(() => {
    if (open && residentId) {
      const fetchResident = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            setError("No token found.");
            return;
          }

          const res = await axios.get(`http://localhost:5000/api/residents/${residentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = res.data;
          console.log("Fetched resident for edit:", data); // debug

          setFormData({
            f_name: data.f_name || "",
            m_name: data.m_name || "",
            l_name: data.l_name || "",
            suffix: data.suffix || "",
            sex: data.sex || "Male",
            birthdate: data.birthdate ? dayjs(data.birthdate) : null,
            birthplace: data.birthplace || "",
            house_no: data.house_no || "",
            street: data.street || "",
            civil_status: data.civil_status || "Single",
            occupation: data.occupation || "",
            citizenship: data.citizenship || "Filipino",
            is_pwd: !!data.is_pwd,
            is_senior: !!data.is_senior,
            is_solop: !!data.is_solop,
          });
        } catch (err) {
          console.error("Fetch single resident error:", err);
          setError("Failed to load resident data.");
        }
      };

      fetchResident();
    }
  }, [open, residentId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, birthdate: date }));
  };

  const handleUpdate = async () => {
    setError("");
    setSuccess("");

    if (!formData.f_name || !formData.l_name || !formData.sex || !formData.birthdate || !formData.birthplace || !formData.civil_status || !formData.street) {
      setError("Please fill all required fields (marked with *)");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found.");
        return;
      }

      const payload = {
        ...formData,
        birthdate: formData.birthdate ? dayjs(formData.birthdate).format("YYYY-MM-DD") : null,
        resident_id: residentId,
      };

      const res = await axios.put("http://localhost:5000/api/residents/update", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(res.data.message || "Resident updated successfully!");
      onSuccess?.();
    } catch (err) {
      console.error("Update error:", err);
      setError(err.response?.data?.message || "Failed to update resident.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: "#e0e0e0", pb: 1 }}>
        Edit Resident
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 3 }}>
        <Stack spacing={2.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 1 }}>
            Personal Information
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

          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Sex *"
              name="sex"
              value={formData.sex}
              onChange={handleChange}
              fullWidth
              required
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Birthdate *"
                value={formData.birthdate}
                onChange={handleDateChange}
                slotProps={{ textField: { fullWidth: true, required: true } }}
                format="MM/DD/YYYY"
              />
            </LocalizationProvider>
          </Stack>

          <TextField
            label="Birthplace *"
            name="birthplace"
            value={formData.birthplace}
            onChange={handleChange}
            fullWidth
            required
          />

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

          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 2 }}>
            Other Information
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Civil Status *"
              name="civil_status"
              value={formData.civil_status}
              onChange={handleChange}
              fullWidth
              required
            >
              <MenuItem value="Single">Single</MenuItem>
              <MenuItem value="Married">Married</MenuItem>
              <MenuItem value="Widowed">Widowed</MenuItem>
              <MenuItem value="Divorced">Divorced</MenuItem>
              <MenuItem value="Separated">Separated</MenuItem>
              <MenuItem value="Annulled">Annulled</MenuItem>
            </TextField>

            <TextField
              label="Occupation"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              fullWidth
            />
          </Stack>

          <TextField
            label="Citizenship"
            name="citizenship"
            value={formData.citizenship}
            onChange={handleChange}
            fullWidth
          />

          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 2 }}>
            Special Sectors
          </Typography>
          <FormGroup row>
            <FormControlLabel
              control={<Checkbox name="is_pwd" checked={formData.is_pwd} onChange={handleChange} />}
              label="Person with Disability (PWD)"
            />
            <FormControlLabel
              control={<Checkbox name="is_senior" checked={formData.is_senior} onChange={handleChange} />}
              label="Senior Citizen"
            />
            <FormControlLabel
              control={<Checkbox name="is_solop" checked={formData.is_solop} onChange={handleChange} />}
              label="Solo Parent"
            />
          </FormGroup>

          {error && <Typography color="error" mt={2}>{error}</Typography>}
          {success && <Typography color="success.main" mt={2}>{success}</Typography>}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleUpdate}
          disabled={loading}
          sx={{ backgroundColor: "#002f59" }}
        >
          {loading ? "Updating..." : "Update Resident"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditResidentModal;