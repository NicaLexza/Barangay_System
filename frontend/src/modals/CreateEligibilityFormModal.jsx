// CreateEligibilityFormModal.jsx
//
// Three-step wizard for creating an eligibility form:
//   1. Details     - name, unit (household / resident), source, quantity, dates
//   2. Recipients  - who qualifies: EVERYONE (no filters) or SET CRITERIA,
//                    with a live "pool vs supply" check
//   3. Review      - summary, then create
//
// The server decides who is in the pool (POST /pool-preview) and rebuilds it
// again on POST /create, so nothing here is trusted for who gets an entry.
// The preview is debounced and stale answers are discarded.
//
// "Who qualifies" has NO default on purpose: it is the most consequential
// setting on the form, so staff must choose it consciously rather than
// leaving filters empty by accident.
import { useState, useEffect, useMemo, useRef } from "react";
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
  MenuItem,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import TuneIcon from "@mui/icons-material/Tune";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import axios from "axios";
import ModalLogoBadge from "../Reusables/ModalLogoBadge.jsx";

const NAVY = "#002f59";
const NAVY_HOVER = "#001c38";
const API = "http://localhost:5000/api/eligibility-forms";
const STEPS = ["Details", "Recipients", "Review"];
const PREVIEW_DEBOUNCE_MS = 400;

const CIVIL_STATUSES = ["Single", "Married", "Widowed", "Divorced", "Separated", "Annulled"];
const SECTORS = [
  { value: "pwd", label: "PWD" },
  { value: "senior", label: "Senior" },
  { value: "solop", label: "Solo parent" },
];

const EMPTY_CRITERIA = {
  ageMin: "",
  ageMax: "",
  sex: "All",
  civilStatuses: [],
  sectors: [],
  occupationContains: "",
  streets: [],
};

const EMPTY_DETAILS = {
  form_name: "",
  source_details: "",
  distribution_details: "",
  target_quantity: "",
  distribution_unit: "Household",
};

// Server error codes that mean "the pool you reviewed is no longer valid".
const POOL_ERROR_CODES = ["POOL_CHANGED", "EMPTY_POOL", "POOL_EXCEEDS_SUPPLY"];

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

// Turns the form's editable state into the exact shape the API expects,
// leaving out anything that isn't restricting anything.
const buildCriteriaPayload = (c) => {
  const out = {};
  if (c.ageMin !== "") out.ageMin = Number(c.ageMin);
  if (c.ageMax !== "") out.ageMax = Number(c.ageMax);
  if (c.sex !== "All") out.sex = c.sex;
  if (c.civilStatuses.length > 0) out.civilStatuses = c.civilStatuses;
  if (c.sectors.length > 0) out.sectors = c.sectors;
  if (c.occupationContains.trim()) out.occupationContains = c.occupationContains.trim();
  if (c.streets.length > 0) out.streets = c.streets;
  return out;
};

const nounFor = (unit, n) =>
  unit === "Household" ? (n === 1 ? "household" : "households") : n === 1 ? "resident" : "residents";

const navyButtonSx = {
  backgroundColor: NAVY,
  "&:hover": { backgroundColor: NAVY_HOVER },
};

const toggleGroupSx = {
  "& .MuiToggleButton-root": {
    py: 1.25,
    fontWeight: 600,
    "&.Mui-selected": {
      backgroundColor: NAVY,
      color: "#fff",
      "&:hover": { backgroundColor: NAVY_HOVER },
    },
  },
};

const CreateEligibilityFormModal = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [startDate, setStartDate] = useState(() => dayjs());
  const [endDate, setEndDate] = useState(null);
  const [audience, setAudience] = useState(null); // "everyone" | "criteria" | null (not chosen yet)
  const [criteria, setCriteria] = useState(EMPTY_CRITERIA);
  const [streetOptions, setStreetOptions] = useState([]);

  // key = the request this answer belongs to. If it doesn't match the
  // current key, the answer is stale and the UI shows "checking".
  const [preview, setPreview] = useState({ key: null, data: null, error: "" });
  const [refreshTick, setRefreshTick] = useState(0);
  const [notice, setNotice] = useState("");

  const [detailsError, setDetailsError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [result, setResult] = useState(null);

  const latestKeyRef = useRef(null);

  const unit = details.distribution_unit;
  const unitNoun = unit === "Household" ? "household" : "resident";
  const qty = Number(details.target_quantity);
  const qtyValid = Number.isInteger(qty) && qty >= 1;

  // "Everyone" sends no criteria at all; the server treats an empty
  // criteria object as every active resident / household.
  const criteriaPayload = useMemo(
    () => (audience === "criteria" ? buildCriteriaPayload(criteria) : {}),
    [audience, criteria]
  );
  const currentKey = useMemo(
    () => JSON.stringify([unit, criteriaPayload, refreshTick]),
    [unit, criteriaPayload, refreshTick]
  );

  // ── Street options, loaded once each time the dialog opens ──────────────
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;

    axios
      .get(`${API}/pool-options`, authHeaders())
      .then(({ data }) => {
        if (!cancelled) setStreetOptions(data.streets || []);
      })
      .catch((err) => console.error("Failed to load street options:", err));

    return () => {
      cancelled = true;
    };
  }, [open]);

  // ── Live pool preview (only on the recipients step, once a choice is made) ─
  useEffect(() => {
    if (!open || step !== 1 || !audience) return undefined;

    const key = currentKey;
    latestKeyRef.current = key;

    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.post(
          `${API}/pool-preview`,
          { distribution_unit: unit, criteria: criteriaPayload },
          authHeaders()
        );
        if (latestKeyRef.current !== key) return; // a newer request superseded this one
        setPreview({ key, data, error: "" });
      } catch (err) {
        if (latestKeyRef.current !== key) return;
        setPreview({
          key,
          data: null,
          error: err.response?.data?.message || "Could not check who qualifies. Try again.",
        });
      }
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [open, step, audience, currentKey, unit, criteriaPayload]);

  // ── Derived state ───────────────────────────────────────────────────────
  const isChecking = preview.key !== currentKey;
  const poolReady = !isChecking && !preview.error && preview.data;
  const poolSize = poolReady ? preview.data.pool_size : null;
  const overSupply = poolSize !== null && qtyValid && poolSize > qty;

  const anyFilterSet = Object.keys(criteriaPayload).length > 0;
  // "Set criteria" with nothing filled in would silently mean everyone, so
  // it is blocked: pick Everyone on purpose, or fill in at least one filter.
  const needsFilters = audience === "criteria" && !anyFilterSet;

  const canContinueFromRecipients =
    audience !== null && !needsFilters && poolSize !== null && poolSize > 0 && qtyValid && !overSupply;

  const columns = useMemo(() => {
    const base = [
      { field: "full_name", headerName: "Name", flex: 1, minWidth: 200 },
      { field: "age", headerName: "Age", width: 70 },
      { field: "sex", headerName: "Sex", width: 80 },
      { field: "address", headerName: "Address", flex: 1, minWidth: 160 },
    ];
    if (unit === "Household") {
      base.push(
        { field: "household_size", headerName: "Members", width: 90 },
        {
          field: "matched_names",
          headerName: "Members who match",
          flex: 1,
          minWidth: 200,
          valueGetter: (value, row) => (row.matched_names || []).join(", "),
        }
      );
    }
    return base;
  }, [unit]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const setCriterion = (name, value) => setCriteria((prev) => ({ ...prev, [name]: value }));

  const toggleSector = (value) => {
    setCriteria((prev) => ({
      ...prev,
      sectors: prev.sectors.includes(value)
        ? prev.sectors.filter((s) => s !== value)
        : [...prev.sectors, value],
    }));
  };

  const validateDetails = () => {
    if (!details.form_name.trim()) return "Enter a form name.";
    if (details.form_name.trim().length > 150) return "Form name must be 150 characters or fewer.";
    if (!details.source_details.trim()) return "Enter where or who this assistance came from.";
    if (!details.distribution_details.trim()) return "Enter what is being distributed.";
    if (!qtyValid) return "Target quantity must be a whole number of at least 1.";
    if (!startDate || !startDate.isValid() || !endDate || !endDate.isValid()) {
      return "Set both a start date and an end date.";
    }
    if (endDate.isBefore(startDate, "day")) return "The end date cannot be before the start date.";
    return "";
  };

  const goFromDetails = () => {
    const message = validateDetails();
    setDetailsError(message);
    if (!message) setStep(1);
  };

  const goToReview = () => {
    if (!canContinueFromRecipients) return;
    setNotice("");
    setStep(2);
  };

  const resetAll = () => {
    setStep(0);
    setDetails(EMPTY_DETAILS);
    setStartDate(dayjs());
    setEndDate(null);
    setAudience(null);
    setCriteria(EMPTY_CRITERIA);
    setPreview({ key: null, data: null, error: "" });
    setRefreshTick(0);
    setNotice("");
    setDetailsError("");
    setCreateError("");
    setResult(null);
    latestKeyRef.current = null;
  };

  const handleClose = () => {
    if (createLoading) return;
    resetAll();
    onClose();
  };

  const handleCreate = async () => {
    setCreateLoading(true);
    setCreateError("");

    try {
      const { data } = await axios.post(
        `${API}/create`,
        {
          form_name: details.form_name.trim(),
          source_details: details.source_details.trim(),
          distribution_details: details.distribution_details.trim(),
          target_quantity: qty,
          start_date: startDate.format("YYYY-MM-DD"),
          end_date: endDate.format("YYYY-MM-DD"),
          distribution_unit: unit,
          criteria: criteriaPayload,
          expected_pool_size: preview.data.pool_size,
        },
        authHeaders()
      );

      setResult(data);
      setStep(3);
      onSuccess?.();
    } catch (err) {
      const code = err.response?.data?.code;
      const message = err.response?.data?.message || "Could not create the form. Try again.";

      if (POOL_ERROR_CODES.includes(code)) {
        // The pool you reviewed is no longer valid: go back and re-check it.
        setNotice(message);
        setRefreshTick((t) => t + 1);
        setStep(1);
      } else {
        setCreateError(message);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Recipients-step banner ──────────────────────────────────────────────
  let banner = null;
  if (audience) {
    if (needsFilters) {
      banner = (
        <Alert severity="info">
          Set at least one filter, or choose Everyone if every {unitNoun} qualifies.
        </Alert>
      );
    } else if (isChecking) {
      banner = (
        <Alert severity="info" icon={<CircularProgress size={18} />}>
          Checking who qualifies...
        </Alert>
      );
    } else if (preview.error) {
      banner = <Alert severity="error">{preview.error}</Alert>;
    } else if (poolSize === 0) {
      banner = <Alert severity="warning">Nobody matches these criteria. Loosen or clear a filter.</Alert>;
    } else if (!qtyValid) {
      banner = (
        <Alert severity="warning">
          {poolSize} {nounFor(unit, poolSize)} qualify. Enter a target quantity of at least 1.
        </Alert>
      );
    } else if (overSupply) {
      banner = (
        <Alert severity="warning">
          {poolSize} {nounFor(unit, poolSize)} qualify but only {qty} can receive (short by {poolSize - qty}).
          Raise the target quantity{audience === "criteria" ? " or narrow the criteria" : ""}. Choosing among
          them is not available yet.
        </Alert>
      );
    } else {
      banner = (
        <Alert severity="success">
          {poolSize} {nounFor(unit, poolSize)} qualify. The supply of {qty} covers everyone
          {qty > poolSize ? ` (${qty - poolSize} to spare)` : ""}.
        </Alert>
      );
    }
  }

  const audienceHint =
    audience === "everyone"
      ? `Every active ${unitNoun} qualifies, with no filters. Suits goods for all, such as a Christmas box for every household.`
      : audience === "criteria"
        ? unit === "Household"
          ? "A household qualifies if at least one of its members matches every filled field."
          : "A resident qualifies if they match every filled field."
        : "Choose Everyone for goods every household or resident gets. Choose Set criteria when only some qualify, such as students or seniors.";

  // ── Review summary rows ─────────────────────────────────────────────────
  const summaryRows =
    step === 2 && poolReady
      ? [
          ["Form name", details.form_name.trim()],
          ["Distribute per", unit === "Household" ? "Household" : "Resident"],
          [
            "Who qualifies",
            audience === "everyone"
              ? `Everyone (every active ${unitNoun})`
              : preview.data.criteria_description,
          ],
          ["Recipients", `${poolSize} ${nounFor(unit, poolSize)}`],
          ["Target quantity", String(qty)],
          ["Schedule", `${startDate.format("MMM D, YYYY")} to ${endDate.format("MMM D, YYYY")}`],
          ["Source", details.source_details.trim()],
          ["Distributing", details.distribution_details.trim()],
        ]
      : [];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: "#e0e0e0", pb: 1.5 }}>
        New eligibility form
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 3 }}>
        {step < 3 && (
          <Stepper activeStep={step} sx={{ mt: 1, mb: 3 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {/* ── Step 1: Details ─────────────────────────────────────────── */}
        {step === 0 && (
          <Stack spacing={2.5}>
            <TextField
              label="Form name *"
              name="form_name"
              value={details.form_name}
              onChange={handleDetailChange}
              fullWidth
            />

            <Box>
              <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1}>
                Distribute per
              </Typography>
              <ToggleButtonGroup
                value={unit}
                exclusive
                fullWidth
                onChange={(e, value) => {
                  if (value) setDetails((prev) => ({ ...prev, distribution_unit: value }));
                }}
                sx={toggleGroupSx}
              >
                <ToggleButton value="Household">
                  <HomeIcon sx={{ mr: 1 }} />
                  Household
                </ToggleButton>
                <ToggleButton value="Resident">
                  <PersonIcon sx={{ mr: 1 }} />
                  Resident
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                {unit === "Household"
                  ? "One entry per household, recorded under the household head. Suits most relief goods."
                  : "One entry per person. Suits school supplies, where each student in a household gets their own."}
              </Typography>
            </Box>

            <TextField
              label="Source or sponsor *"
              name="source_details"
              value={details.source_details}
              onChange={handleDetailChange}
              fullWidth
              multiline
              minRows={2}
              placeholder="Where or who this assistance came from, for example DSWD, LGU Manila, a private donor"
            />

            <TextField
              label="What is being distributed *"
              name="distribution_details"
              value={details.distribution_details}
              onChange={handleDetailChange}
              fullWidth
              multiline
              minRows={2}
              placeholder="For example 1,000 pesos cash assistance, a relief goods pack"
            />

            <TextField
              label="Target quantity *"
              name="target_quantity"
              type="number"
              value={details.target_quantity}
              onChange={handleDetailChange}
              fullWidth
              inputProps={{ min: 1 }}
              helperText="How many will be given. Everyone who qualifies must fit within it."
            />

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack direction="row" spacing={2}>
                <DatePicker
                  label="Start date *"
                  value={startDate}
                  onChange={setStartDate}
                  format="MM/DD/YYYY"
                  maxDate={endDate || undefined}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="End date *"
                  value={endDate}
                  onChange={setEndDate}
                  format="MM/DD/YYYY"
                  minDate={startDate || undefined}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Stack>
            </LocalizationProvider>
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
              The form locks automatically after the end date.
            </Typography>

            {detailsError && <Typography color="error">{detailsError}</Typography>}
          </Stack>
        )}

        {/* ── Step 2: Recipients (everyone or criteria) + live pool ───── */}
        {step === 1 && (
          <Stack spacing={2}>
            {notice && (
              <Alert severity="warning" onClose={() => setNotice("")}>
                {notice}
              </Alert>
            )}

            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Who qualifies
              </Typography>
              <ToggleButtonGroup
                value={audience}
                exclusive
                fullWidth
                onChange={(e, value) => {
                  if (value) setAudience(value);
                }}
                sx={{ ...toggleGroupSx, mt: 1 }}
              >
                <ToggleButton value="everyone">
                  <GroupsIcon sx={{ mr: 1 }} />
                  Everyone
                </ToggleButton>
                <ToggleButton value="criteria">
                  <TuneIcon sx={{ mr: 1 }} />
                  Set criteria
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                {audienceHint}
              </Typography>
            </Box>

            {audience === "criteria" && (
              <>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-start" }}>
                  <TextField
                    label="Age from"
                    type="number"
                    size="small"
                    value={criteria.ageMin}
                    onChange={(e) => setCriterion("ageMin", e.target.value)}
                    inputProps={{ min: 0, max: 130 }}
                    sx={{ width: 110 }}
                  />
                  <TextField
                    label="Age to"
                    type="number"
                    size="small"
                    value={criteria.ageMax}
                    onChange={(e) => setCriterion("ageMax", e.target.value)}
                    inputProps={{ min: 0, max: 130 }}
                    sx={{ width: 110 }}
                  />
                  <TextField
                    select
                    label="Sex"
                    size="small"
                    value={criteria.sex}
                    onChange={(e) => setCriterion("sex", e.target.value)}
                    sx={{ width: 130 }}
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                  <TextField
                    label="Occupation contains"
                    size="small"
                    value={criteria.occupationContains}
                    onChange={(e) => setCriterion("occupationContains", e.target.value)}
                    placeholder="For example student"
                    sx={{ width: 220 }}
                  />
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "flex-start" }}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={CIVIL_STATUSES}
                    value={criteria.civilStatuses}
                    onChange={(e, value) => setCriterion("civilStatuses", value)}
                    renderInput={(params) => <TextField {...params} label="Civil status" />}
                    sx={{ flex: "1 1 240px", minWidth: 240 }}
                  />
                  <Autocomplete
                    multiple
                    size="small"
                    options={streetOptions}
                    value={criteria.streets}
                    onChange={(e, value) => setCriterion("streets", value)}
                    noOptionsText="No streets found"
                    renderInput={(params) => <TextField {...params} label="Street" />}
                    sx={{ flex: "1 1 240px", minWidth: 240 }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <FormControl>
                    <FormLabel sx={{ fontSize: "0.8rem" }}>Sector (any of)</FormLabel>
                    <FormGroup row>
                      {SECTORS.map((s) => (
                        <FormControlLabel
                          key={s.value}
                          control={
                            <Checkbox
                              size="small"
                              checked={criteria.sectors.includes(s.value)}
                              onChange={() => toggleSector(s.value)}
                            />
                          }
                          label={s.label}
                        />
                      ))}
                    </FormGroup>
                  </FormControl>
                  {anyFilterSet && (
                    <Button size="small" onClick={() => setCriteria(EMPTY_CRITERIA)}>
                      Clear filters
                    </Button>
                  )}
                </Box>
              </>
            )}

            {audience && (
              <>
                <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <Box sx={{ flex: "1 1 420px", minWidth: 0 }}>{banner}</Box>
                  <TextField
                    label="Target quantity"
                    name="target_quantity"
                    type="number"
                    size="small"
                    value={details.target_quantity}
                    onChange={handleDetailChange}
                    inputProps={{ min: 1 }}
                    sx={{ width: 150 }}
                  />
                </Box>

                {poolReady &&
                  !needsFilters &&
                  preview.data.warnings?.map((w) => (
                    <Alert key={w.code} severity="warning">
                      {w.message}
                    </Alert>
                  ))}

                {!needsFilters && (
                  <Box sx={{ height: 300, opacity: isChecking ? 0.5 : 1, transition: "opacity 0.15s ease" }}>
                    <DataGrid
                      rows={preview.data?.candidates ?? []}
                      columns={columns}
                      getRowId={(row) => row.resident_id}
                      density="compact"
                      hideFooter
                      disableRowSelectionOnClick
                      localeText={{ noRowsLabel: "Nobody to show yet." }}
                    />
                  </Box>
                )}
              </>
            )}
          </Stack>
        )}

        {/* ── Step 3: Review ─────────────────────────────────────────── */}
        {step === 2 && (
          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "150px 1fr",
                rowGap: 1.25,
                columnGap: 2,
                p: 2,
                backgroundColor: "#f7f9fc",
                border: "1px solid #e2e8f0",
                borderRadius: 2,
              }}
            >
              {summaryRows.map(([label, value]) => (
                <Box key={label} sx={{ display: "contents" }}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ wordBreak: "break-word" }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Who qualifies is decided when you create the form. It does not update if residents change later.
            </Typography>
            {createError && <Alert severity="error">{createError}</Alert>}
          </Stack>
        )}

        {/* ── Result ─────────────────────────────────────────────────── */}
        {step === 3 && result && (
          <Stack spacing={2} alignItems="center" sx={{ py: 3 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 56, color: "#2e7d32" }} />
            <Typography variant="h6" fontWeight={600}>
              Form created
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {result.message}
            </Typography>
            {result.warnings?.map((w) => (
              <Alert key={w.code} severity="warning" sx={{ width: "100%" }}>
                {w.message}
              </Alert>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, justifyContent: "space-between", alignItems: "center" }}>
        <ModalLogoBadge />
        <Box sx={{ display: "flex", gap: 1 }}>
          {step === 0 && (
            <>
              <Button onClick={handleClose}>Cancel</Button>
              <Button variant="contained" onClick={goFromDetails} sx={navyButtonSx}>
                Next
              </Button>
            </>
          )}
          {step === 1 && (
            <>
              <Button onClick={() => setStep(0)}>Back</Button>
              <Button
                variant="contained"
                onClick={goToReview}
                disabled={!canContinueFromRecipients}
                sx={navyButtonSx}
              >
                Next
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button onClick={() => setStep(1)} disabled={createLoading}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleCreate}
                disabled={createLoading}
                startIcon={createLoading ? <CircularProgress size={16} color="inherit" /> : null}
                sx={navyButtonSx}
              >
                {createLoading ? "Creating..." : "Create form"}
              </Button>
            </>
          )}
          {step === 3 && (
            <Button variant="contained" onClick={handleClose} sx={navyButtonSx}>
              Done
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default CreateEligibilityFormModal;