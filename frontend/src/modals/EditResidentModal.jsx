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
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import axios from "axios";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

  


const EditResidentModal = ({ open, onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        f_name: initialData.f_name || initialData.fullName || "",
        m_name: initialData.m_name || "",
        l_name: initialData.l_name || "",
        suffix: initialData.suffix || "",
        place_of_birth: initialData.place_of_birth || initialData.placeOfBirth || "",
        sex: initialData.sex || "Male",
        birthdate: initialData.birthdate ? dayjs(initialData.birthdate) : null,
        age: initialData.age || "",
        house_no: initialData.house_no || initialData.houseNo || "",
        street: initialData.street || "",
        civil_status: initialData.civilStatus || "Single",
        occupation: initialData.occupation || "",
        citizenship: initialData.citizenship || "Filipino",
        is_pwd: initialData.is_pwd || false,
        is_senior: initialData.is_senior || false,
        is_solop: initialData.is_solop || false,
      });
    } else {
      setFormData({});
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, birthdate: date }));
  };

  const handleUpdate = async () => {
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...formData,
        birthdate: formData.birthdate ? dayjs(formData.birthdate).format("YYYY-MM-DD") : null,
        resident_id: initialData?.id || initialData?.resident_id,
      };

      await axios.put("http://localhost:5000/api/residents/update", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Small delay to ensure backend update completes
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 300);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update resident.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
  open={open}
  onClose={onClose}
  maxWidth="sm"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: 3,
    },
  }}
>
  {/* Header */}
  <DialogTitle
    sx={{
      fontWeight: 600,
      borderBottom: "1px solid #e0e0e0",
      pb: 1,
    }}
  >
    Edit Record
  </DialogTitle>

  {/* Content */}
  <DialogContent sx={{ px: 4, py: 3, bgcolor: "#f3f7fb" }}>
    <Stack spacing={2}>
      {/* Personal Information Section */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
        Personal Information
      </Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          label="First Name"
          name="f_name"
          value={formData.f_name || ""}
          onChange={handleChange}
          fullWidth
          size="small"
        />
        <TextField
          label="Middle Name"
          name="m_name"
          value={formData.m_name || ""}
          onChange={handleChange}
          fullWidth
          size="small"
        />
        <TextField
          label="Last Name"
          name="l_name"
          value={formData.l_name || ""}
          onChange={handleChange}
          fullWidth
          size="small"
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Suffix (Jr, Sr, etc.)"
          name="suffix"
          value={formData.suffix || ""}
          onChange={handleChange}
          fullWidth
          size="small"
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Place of Birth"
          name="place_of_birth"
          value={formData.place_of_birth || ""}
          onChange={handleChange}
          fullWidth
          size="small"
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Birthdate"
            value={formData.birthdate || null}
            onChange={handleDateChange}
            format="MM/DD/YYYY"
            slotProps={{ textField: { fullWidth: true, size: "small" } }}
          />
        </LocalizationProvider>
        <TextField
          label="Age"
          name="age"
          type="number"
          value={formData.age || ""}
          onChange={handleChange}
          fullWidth
          size="small"
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          select
          label="Sex"
          name="sex"
          value={formData.sex || "Male"}
          onChange={handleChange}
          fullWidth
          size="small"
        >
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
        </TextField>
        <TextField
          select
          label="Civil Status"
          name="civil_status"
          value={formData.civil_status || "Single"}
          onChange={handleChange}
          fullWidth
          size="small"
        >
          <MenuItem value="Single">Single</MenuItem>
          <MenuItem value="Married">Married</MenuItem>
          <MenuItem value="Widowed">Widowed</MenuItem>
          <MenuItem value="Divorced">Divorced</MenuItem>
          <MenuItem value="Separated">Separated</MenuItem>
          <MenuItem value="Annulled">Annulled</MenuItem>
        </TextField>
      </Stack>

      {/* Address Section */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
        Address
      </Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          label="House No. / Block / Lot"
          name="house_no"
          value={formData.house_no || ""}
          onChange={handleChange}
          fullWidth
          size="small"
        />
        <TextField
          label="Street"
          name="street"
          value={formData.street || ""}
          onChange={handleChange}
          fullWidth
          size="small"
        />
      </Stack>

      {/* Other Information Section */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
        Other Information
      </Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Occupation"
          name="occupation"
          value={formData.occupation || ""}
          onChange={handleChange}
          fullWidth
          size="small"
        />
        <TextField
          label="Citizenship"
          name="citizenship"
          value={formData.citizenship || ""}
          onChange={handleChange}
          fullWidth
          size="small"
        />
      </Stack>

      {error && (
        <Typography color="error" fontSize={13}>
          {error}
        </Typography>
      )}
    </Stack>
  </DialogContent>

  {/* Special Sectors Section */}
  <Stack spacing={1} sx={{ px: 4, py: 2, bgcolor: "#f3f7fb", borderTop: "1px solid #e0e0e0" }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
      Special Sectors
    </Typography>

    <FormGroup>
      <FormControlLabel
        control={
          <Checkbox
            name="is_solop"
            checked={formData.is_solop || false}
            onChange={handleChange}
          />
        }
        label="Solo Parent"
      />

      <FormControlLabel
        control={
          <Checkbox
            name="is_pwd"
            checked={formData.is_pwd || false}
            onChange={handleChange}
          />
        }
        label="PWD"
      />

      <FormControlLabel
        control={
          <Checkbox
            name="is_senior"
            checked={formData.is_senior || false}
            onChange={handleChange}
          />
        }
        label="Senior Citizen"
      />
    </FormGroup>
  </Stack>

  {/* Actions */}
  <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 3, pt: 2 }}>
    <Button
      variant="contained"
      onClick={handleUpdate}
      disabled={loading}
      sx={{
        minWidth: 140,
        bgcolor: "#002f59",
        textTransform: "none",
      }}
    >
      {loading ? "Updating..." : "Update Record"}
    </Button>

    <Button
      variant="outlined"
      onClick={onClose}
      disabled={loading}
      sx={{ minWidth: 100, textTransform: "none" }}
    >
      Back
    </Button>
  </DialogActions>
</Dialog>

  );
};

export default EditResidentModal;
