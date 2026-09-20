// AddResidentModal.jsx
import React, { useState } from "react";
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
  Box,
  RadioGroup,
  Radio,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import ModalLogoBadge from "../Reusables/ModalLogoBadge.jsx";

const AddResidentModal = ({ open, onClose, onSuccess }) => {
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
    // is_senior removed — Senior Citizen status is now always computed
    // server-side from birthdate (age >= 60), never set manually here.
    is_solop: false,
    head_resident_id: null,
  });

  const [mode, setMode] = useState("head"); // "head" | "member"
  const [heads, setHeads] = useState([]);
  const [loadingHeads, setLoadingHeads] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch heads when switching to member mode
  React.useEffect(() => {
    if (mode === "member" && open) {
      setLoadingHeads(true);
      axios.get("http://localhost:5000/api/residents/heads", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      .then(res => setHeads(res.data))
      .catch(err => console.error("Failed to fetch heads", err))
      .finally(() => setLoadingHeads(false));
    }
  }, [mode, open]);

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

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!formData.f_name || !formData.l_name || !formData.sex || !formData.birthdate || !formData.birthplace || !formData.civil_status) {
      setError("Please fill all required personal fields (marked with *)");
      return;
    }

    if (mode === "head" && !formData.street) {
      setError("Street is required for a new household.");
      return;
    }

    if (mode === "member" && !formData.head_resident_id) {
      setError("Please select a household head.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in again.");
        return;
      }

      const payload = {
        ...formData,
        birthdate: formData.birthdate ? dayjs(formData.birthdate).format("YYYY-MM-DD") : null,
      };

      // Address is irrelevant for members (handled by backend anyway)
      if (mode === "member") {
        delete payload.house_no;
        delete payload.street;
      } else {
        delete payload.head_resident_id;
      }

      const res = await axios.post("http://localhost:5000/api/residents/add", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess(res.data.message || "Resident added successfully!");

      // Clear form
      setFormData({
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
        is_solop: false,
        head_resident_id: null,
      });
      setMode("head");

      onSuccess?.();
    } catch (err) {
      console.error("Add resident error:", err);
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to add resident. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: "#e0e0e0", pb: 1 }}>
        Add New Resident
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 3 }}>
        <Stack spacing={2.5}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>Registration Type</Typography>
            <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value)}>
              <FormControlLabel value="head" control={<Radio />} label="New Household (Head)" />
              <FormControlLabel value="member" control={<Radio />} label="Add Household Member" />
            </RadioGroup>
          </Box>

          {mode === "member" && (
            <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 1, border: "1px solid #e2e8f0" }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, color: "#334155" }}>
                Select Household Head
              </Typography>
              <Autocomplete
                options={heads}
                loading={loadingHeads}
                getOptionLabel={(option) => `${option.fullName} — ${option.address}`}
                isOptionEqualToValue={(option, value) => option.resident_id === value.resident_id}
                onChange={(e, newValue) => {
                  setFormData(prev => ({ ...prev, head_resident_id: newValue ? newValue.resident_id : null }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search for Head *"
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {loadingHeads ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      ),
                    }}
                  />
                )}
              />
            </Box>
          )}

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
            label="Birthplace"
            name="birthplace"
            value={formData.birthplace}
            onChange={handleChange}
            fullWidth
          />

          {mode === "head" && (
            <>
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
            </>
          )}

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
            {/* Senior Citizen is intentionally not a checkbox here — it's
                always computed from Birthdate (age >= 60) on save, so it
                can never go out of sync with the resident's actual age. */}
            <FormControlLabel
              control={<Checkbox name="is_solop" checked={formData.is_solop} onChange={handleChange} />}
              label="Solo Parent"
            />
          </FormGroup>
 
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
            onClick={handleSave}
            disabled={loading}
            sx={{ backgroundColor: "#002f59" }}
          >
            {loading ? "Saving..." : "Add Resident"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AddResidentModal;