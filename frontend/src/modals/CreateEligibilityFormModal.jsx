// CreateEligibilityFormModal.jsx
//
// Five-state wizard for creating an eligibility form:
//   1. Details     - name, unit (household / resident), source, quantity, dates
//   2. Recipients  - who qualifies: EVERYONE (no filters) or SET CRITERIA,
//                    with a live "pool vs supply" check
//   3. Selection    - ONLY shown when the pool is bigger than supply. Priority
//                    factors + weights, a live ranked list, and a tie draw
//                    when the cutoff falls on a tie
//   4. Review       - summary, then create
//   5. Result
//
// The server decides who is in the pool and how it's ranked — nothing here
// is trusted for who gets an entry. Both live checks (pool-preview and
// rank-preview) are debounced and stale answers are discarded.
//
// Forms that need selection (Selection was shown) require an Admin's
// re-auth to finalize, the same pattern as backup/restore and the archived
// eligibility form actions — weights and the tie draw decide who gets aid,
// which is as consequential as those actions.
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
  Chip,
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
import ReAuthModal from "./ReAuthModal.jsx";

const NAVY = "#002f59";
const NAVY_HOVER = "#001c38";
const API = "http://localhost:5000/api/eligibility-forms";
const PREVIEW_DEBOUNCE_MS = 400;

const STEP_DETAILS = 0;
const STEP_RECIPIENTS = 1;
const STEP_SELECTION = 2;
const STEP_REVIEW = 3;
const STEP_RESULT = 4;
const STEP_LABELS = ["Details", "Recipients", "Selection", "Review"];

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

// Turns the form's editable criteria state into the exact shape the API
// expects, leaving out anything that isn't restricting anything.
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
  const [step, setStep] = useState(STEP_DETAILS);
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [startDate, setStartDate] = useState(() => dayjs());
  const [endDate, setEndDate] = useState(null);
  const [audience, setAudience] = useState(null); // "everyone" | "criteria" | null
  const [criteria, setCriteria] = useState(EMPTY_CRITERIA);
  const [streetOptions, setStreetOptions] = useState([]);

  // ── Recipients step: pool-vs-supply preview ──────────────────────────
  const [preview, setPreview] = useState({ key: null, data: null, error: "" });
  const [refreshTick, setRefreshTick] = useState(0);
  const [notice, setNotice] = useState("");
  const [detailsError, setDetailsError] = useState("");
  const latestKeyRef = useRef(null);

  // ── Selection step: priority factors + ranking ────────────────────────
  const [cameFromSelection, setCameFromSelection] = useState(false);
  const [priorityFactors, setPriorityFactors] = useState([]);
  const [priorityFactorsLoading, setPriorityFactorsLoading] = useState(false);
  const [priorityConfig, setPriorityConfig] = useState({ factors: {}, lookbackDays: 90 });
  const [rankPreview, setRankPreview] = useState({ key: null, data: null, error: "" });
  const [rankRefreshTick, setRankRefreshTick] = useState(0);
  const [seed, setSeed] = useState(null);
  const [drawLoading, setDrawLoading] = useState(false);
  const [drawError, setDrawError] = useState("");
  const lastLoadedUnitRef = useRef(null);
  const latestRankKeyRef = useRef(null);

  // ── Create (plain, non-ranked) ─────────────────────────────────────────
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [result, setResult] = useState(null);

  // ── Create (ranked, Admin re-auth) ─────────────────────────────────────
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [reAuthLoading, setReAuthLoading] = useState(false);
  const [reAuthError, setReAuthError] = useState("");

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

  const priorityConfigPayload = useMemo(() => {
    if (priorityFactors.length === 0) return null;
    const factors = {};
    priorityFactors.forEach((f) => {
      const setting = priorityConfig.factors[f.id];
      factors[f.id] = {
        enabled: setting ? setting.enabled : f.defaultEnabled,
        weight: setting ? setting.weight : f.defaultWeight,
      };
    });
    return { factors, lookbackDays: priorityConfig.lookbackDays };
  }, [priorityFactors, priorityConfig]);

  const rankKey = useMemo(
    () => JSON.stringify([unit, criteriaPayload, qty, priorityConfigPayload, rankRefreshTick]),
    [unit, criteriaPayload, qty, priorityConfigPayload, rankRefreshTick]
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

  // ── Priority factor catalogue, (re)loaded whenever the unit changes ────
  useEffect(() => {
    if (!open) return undefined;
    if (lastLoadedUnitRef.current === unit) return undefined;
    let cancelled = false;

    setPriorityFactorsLoading(true);
    axios
      .get(`${API}/priority-factors?unit=${unit}`, authHeaders())
      .then(({ data }) => {
        if (cancelled) return;
        lastLoadedUnitRef.current = unit;
        setPriorityFactors(data.factors);
        const factors = {};
        data.factors.forEach((f) => {
          factors[f.id] = { enabled: f.defaultEnabled, weight: f.defaultWeight };
        });
        setPriorityConfig({ factors, lookbackDays: 90 });
        setSeed(null);
        setRankPreview({ key: null, data: null, error: "" });
      })
      .catch((err) => console.error("Failed to load priority factors:", err))
      .finally(() => {
        if (!cancelled) setPriorityFactorsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, unit]);

  // ── Live pool preview (Recipients step, once an audience is chosen) ────
  useEffect(() => {
    if (!open || step !== STEP_RECIPIENTS || !audience) return undefined;

    const key = currentKey;
    latestKeyRef.current = key;

    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.post(
          `${API}/pool-preview`,
          { distribution_unit: unit, criteria: criteriaPayload },
          authHeaders()
        );
        if (latestKeyRef.current !== key) return;
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

  // ── Live ranking (Selection step). Always clears any prior draw's seed —
  // a seed only survives via the Draw button setting rankPreview directly,
  // never through this effect. ──────────────────────────────────────────
  useEffect(() => {
    if (!open || step !== STEP_SELECTION || !priorityConfigPayload) return undefined;

    const key = rankKey;
    latestRankKeyRef.current = key;

    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.post(
          `${API}/rank-preview`,
          { distribution_unit: unit, criteria: criteriaPayload, priority_config: priorityConfigPayload, target_quantity: qty },
          authHeaders()
        );
        if (latestRankKeyRef.current !== key) return;
        setSeed(null);
        setRankPreview({ key, data, error: "" });
      } catch (err) {
        if (latestRankKeyRef.current !== key) return;
        setSeed(null);
        setRankPreview({
          key,
          data: null,
          error: err.response?.data?.message || "Could not build the ranking. Try again.",
        });
      }
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [open, step, rankKey, unit, criteriaPayload, qty, priorityConfigPayload]);

  // ── Derived state ───────────────────────────────────────────────────────
  const isChecking = preview.key !== currentKey;
  const poolReady = !isChecking && !preview.error && preview.data;
  const poolSize = poolReady ? preview.data.pool_size : null;
  const overSupply = poolSize !== null && qtyValid && poolSize > qty;

  const anyFilterSet = Object.keys(criteriaPayload).length > 0;
  const needsFilters = audience === "criteria" && !anyFilterSet;

  const canContinueFromRecipients =
    audience !== null && !needsFilters && poolSize !== null && poolSize > 0 && qtyValid;

  const isRanking = rankPreview.key !== rankKey;
  const rankReady = !isRanking && !rankPreview.error && rankPreview.data;
  const tie = rankReady ? rankPreview.data.tie : null;
  const canContinueFromSelection = rankReady && (!tie || tie.needsDraw === false);

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

  const rankColumns = useMemo(
    () => [
      { field: "rank_no", headerName: "#", width: 56 },
      { field: "full_name", headerName: "Name", flex: 1, minWidth: 180 },
      { field: "score", headerName: "Score", width: 80 },
      {
        field: "breakdown",
        headerName: "Why",
        flex: 1.4,
        minWidth: 220,
        sortable: false,
        valueGetter: (value, row) => (row.breakdown || []).map((b) => `${b.label} +${b.points}`).join(", ") || "—",
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value}
            sx={{
              fontWeight: 600,
              fontSize: "0.7rem",
              backgroundColor: params.value === "Selected" ? "#e8f5e9" : "#f1f5f9",
              color: params.value === "Selected" ? "#2e7d32" : "#64748b",
            }}
          />
        ),
      },
    ],
    []
  );

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

  const setFactorField = (id, key, value) => {
    setPriorityConfig((prev) => ({
      ...prev,
      factors: { ...prev.factors, [id]: { ...prev.factors[id], [key]: value } },
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
    if (!message) setStep(STEP_RECIPIENTS);
  };

  const goFromRecipients = () => {
    if (!canContinueFromRecipients) return;
    setNotice("");
    if (overSupply) {
      setCameFromSelection(true);
      setStep(STEP_SELECTION);
    } else {
      setCameFromSelection(false);
      setStep(STEP_REVIEW);
    }
  };

  const goFromSelection = () => {
    if (!canContinueFromSelection) return;
    setStep(STEP_REVIEW);
  };

  const handleDraw = async () => {
    setDrawLoading(true);
    setDrawError("");
    try {
      const { data } = await axios.post(
        `${API}/rank-draw`,
        { distribution_unit: unit, criteria: criteriaPayload, priority_config: priorityConfigPayload, target_quantity: qty },
        authHeaders()
      );
      setSeed(data.seed);
      setRankPreview({ key: rankKey, data, error: "" });
    } catch (err) {
      setDrawError(err.response?.data?.message || "Could not draw. Try again.");
    } finally {
      setDrawLoading(false);
    }
  };

  const resetAll = () => {
    setStep(STEP_DETAILS);
    setDetails(EMPTY_DETAILS);
    setStartDate(dayjs());
    setEndDate(null);
    setAudience(null);
    setCriteria(EMPTY_CRITERIA);
    setPreview({ key: null, data: null, error: "" });
    setRefreshTick(0);
    setNotice("");
    setDetailsError("");
    latestKeyRef.current = null;

    setCameFromSelection(false);
    setPriorityFactors([]);
    setPriorityConfig({ factors: {}, lookbackDays: 90 });
    setRankPreview({ key: null, data: null, error: "" });
    setRankRefreshTick(0);
    setSeed(null);
    setDrawError("");
    lastLoadedUnitRef.current = null;
    latestRankKeyRef.current = null;

    setCreateError("");
    setResult(null);
    setReAuthOpen(false);
    setReAuthError("");
  };

  const handleClose = () => {
    if (createLoading || reAuthLoading) return;
    resetAll();
    onClose();
  };

  // Plain create (no ranking needed) — unchanged from before.
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
      setStep(STEP_RESULT);
      onSuccess?.();
    } catch (err) {
      const code = err.response?.data?.code;
      const message = err.response?.data?.message || "Could not create the form. Try again.";

      if (POOL_ERROR_CODES.includes(code)) {
        setNotice(message);
        setRefreshTick((t) => t + 1);
        setStep(STEP_RECIPIENTS);
      } else {
        setCreateError(message);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // Ranked create — gated behind Admin re-auth.
  const handleReAuthClose = () => {
    if (reAuthLoading) return;
    setReAuthOpen(false);
    setReAuthError("");
  };

  const handleRankedCreate = async ({ username, password }) => {
    setReAuthLoading(true);
    setReAuthError("");

    try {
      const { data } = await axios.post(
        `${API}/create-ranked`,
        {
          form_name: details.form_name.trim(),
          source_details: details.source_details.trim(),
          distribution_details: details.distribution_details.trim(),
          start_date: startDate.format("YYYY-MM-DD"),
          end_date: endDate.format("YYYY-MM-DD"),
          distribution_unit: unit,
          criteria: criteriaPayload,
          priority_config: priorityConfigPayload,
          target_quantity: qty,
          expected_pool_size: rankPreview.data.pool_size,
          seed: seed || null,
          username,
          password,
        },
        authHeaders()
      );

      setReAuthOpen(false);
      setResult(data);
      setStep(STEP_RESULT);
      onSuccess?.();
    } catch (err) {
      const code = err.response?.data?.code;
      const message = err.response?.data?.message || "Could not create the form. Try again.";

      if (code === "POOL_CHANGED") {
        setReAuthOpen(false);
        setNotice(message);
        setRankRefreshTick((t) => t + 1);
        setStep(STEP_SELECTION);
      } else if (code === "NO_SELECTION_NEEDED") {
        setReAuthOpen(false);
        setNotice(message);
        setRefreshTick((t) => t + 1);
        setStep(STEP_RECIPIENTS);
      } else if (code === "TIE_UNRESOLVED") {
        setReAuthOpen(false);
        setSeed(null);
        setNotice(message);
        setRankRefreshTick((t) => t + 1);
        setStep(STEP_SELECTION);
      } else {
        // Wrong credentials, not an Admin, inactive account, server error — stay
        // on the re-auth dialog and show it there, matching backup/restore.
        setReAuthError(message);
      }
    } finally {
      setReAuthLoading(false);
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
          The next step lets you rank them by priority to decide who gets it.
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

  // ── Selection-step banner ───────────────────────────────────────────────
  let rankBanner = null;
  if (isRanking) {
    rankBanner = (
      <Alert severity="info" icon={<CircularProgress size={18} />}>
        Building the ranking...
      </Alert>
    );
  } else if (rankPreview.error) {
    rankBanner = <Alert severity="error">{rankPreview.error}</Alert>;
  } else if (tie) {
    rankBanner = (
      <Alert
        severity="warning"
        action={
          tie.needsDraw ? (
            <Button size="small" onClick={handleDraw} disabled={drawLoading} sx={{ whiteSpace: "nowrap" }}>
              {drawLoading ? "Drawing..." : "Draw lots"}
            </Button>
          ) : null
        }
      >
        {tie.tiedCount} {nounFor(unit, tie.tiedCount)} are tied at {tie.atScore} points, competing for{" "}
        {tie.slotsAtStake} remaining slot{tie.slotsAtStake === 1 ? "" : "s"}.
        {!tie.needsDraw && seed ? ` Resolved by a recorded draw (seed ${seed}).` : ""}
      </Alert>
    );
  } else if (rankReady) {
    const selectedCount = rankPreview.data.ranked.filter((c) => c.status === "Selected").length;
    const waitlistedCount = rankPreview.data.ranked.length - selectedCount;
    rankBanner = (
      <Alert severity="success">
        Ranking ready — {selectedCount} selected, {waitlistedCount} waitlisted.
      </Alert>
    );
  }

  // ── Review summary rows ─────────────────────────────────────────────────
  let summaryRows = [];
  if (step === STEP_REVIEW) {
    if (cameFromSelection && rankReady) {
      const selectedCount = rankPreview.data.ranked.filter((c) => c.status === "Selected").length;
      const waitlistedCount = rankPreview.data.ranked.length - selectedCount;
      summaryRows = [
        ["Form name", details.form_name.trim()],
        ["Distribute per", unit === "Household" ? "Household" : "Resident"],
        [
          "Who qualifies",
          audience === "everyone" ? `Everyone (every active ${unitNoun})` : rankPreview.data.criteria_description,
        ],
        ["Selection", `Ranked by priority — ${selectedCount} selected of ${rankPreview.data.pool_size}, ${waitlistedCount} waitlisted`],
        ["Priority factors", rankPreview.data.priority_description],
        ["Target quantity", String(qty)],
        ["Schedule", `${startDate.format("MMM D, YYYY")} to ${endDate.format("MMM D, YYYY")}`],
        ["Source", details.source_details.trim()],
        ["Distributing", details.distribution_details.trim()],
      ];
    } else if (poolReady) {
      summaryRows = [
        ["Form name", details.form_name.trim()],
        ["Distribute per", unit === "Household" ? "Household" : "Resident"],
        [
          "Who qualifies",
          audience === "everyone" ? `Everyone (every active ${unitNoun})` : preview.data.criteria_description,
        ],
        ["Recipients", `${poolSize} ${nounFor(unit, poolSize)}`],
        ["Target quantity", String(qty)],
        ["Schedule", `${startDate.format("MMM D, YYYY")} to ${endDate.format("MMM D, YYYY")}`],
        ["Source", details.source_details.trim()],
        ["Distributing", details.distribution_details.trim()],
      ];
    }
  }

  const selectedCountForReAuth = rankReady ? rankPreview.data.ranked.filter((c) => c.status === "Selected").length : 0;
  const waitlistedCountForReAuth = rankReady ? rankPreview.data.ranked.length - selectedCountForReAuth : 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ borderBottom: 1, borderColor: "#e0e0e0", pb: 1.5 }}>
        New eligibility form
      </DialogTitle>

      <DialogContent sx={{ px: 4, py: 3 }}>
        {step < STEP_RESULT && (
          <Stepper activeStep={step} sx={{ mt: 1, mb: 3 }}>
            {STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {/* ── Step: Details ──────────────────────────────────────────── */}
        {step === STEP_DETAILS && (
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
              helperText="How many will be given. If more qualify than this, you'll be able to rank them by priority."
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

        {/* ── Step: Recipients (everyone or criteria) + live pool ─────── */}
        {step === STEP_RECIPIENTS && (
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

        {/* ── Step: Selection (only when pool > supply) ────────────────── */}
        {step === STEP_SELECTION && (
          <Stack spacing={2}>
            {notice && (
              <Alert severity="warning" onClose={() => setNotice("")}>
                {notice}
              </Alert>
            )}

            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Choose who gets priority
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {poolSize !== null ? `${poolSize} ${nounFor(unit, poolSize)} qualify, but only ${qty} can receive.` : ""}{" "}
                Turn a factor on and set how much it counts — higher scores rank first. Everyone below the cutoff
                becomes an ordered waitlist.
              </Typography>
            </Box>

            {priorityFactorsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Stack spacing={1}>
                {priorityFactors.map((f) => {
                  const setting = priorityConfig.factors[f.id] || { enabled: f.defaultEnabled, weight: f.defaultWeight };
                  return (
                    <Box
                      key={f.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        flexWrap: "wrap",
                        py: 0.5,
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <FormControlLabel
                        sx={{ minWidth: 230 }}
                        control={
                          <Checkbox
                            checked={setting.enabled}
                            onChange={(e) => setFactorField(f.id, "enabled", e.target.checked)}
                          />
                        }
                        label={f.label}
                      />
                      <TextField
                        label="Weight"
                        type="number"
                        size="small"
                        value={setting.weight}
                        onChange={(e) => setFactorField(f.id, "weight", e.target.value)}
                        disabled={!setting.enabled}
                        inputProps={{ min: 0, max: 5 }}
                        sx={{ width: 90 }}
                      />
                      {f.hasLookback && (
                        <TextField
                          label="Within (days)"
                          type="number"
                          size="small"
                          value={priorityConfig.lookbackDays}
                          onChange={(e) =>
                            setPriorityConfig((prev) => ({ ...prev, lookbackDays: e.target.value }))
                          }
                          disabled={!setting.enabled}
                          inputProps={{ min: 1, max: 365 }}
                          sx={{ width: 130 }}
                        />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        up to {f.cap} point{f.cap === 1 ? "" : "s"}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            )}

            {rankBanner}
            {drawError && (
              <Typography color="error" variant="body2">
                {drawError}
              </Typography>
            )}

            <Box sx={{ height: 320, opacity: isRanking ? 0.5 : 1, transition: "opacity 0.15s ease" }}>
              <DataGrid
                rows={rankReady ? rankPreview.data.ranked : []}
                columns={rankColumns}
                getRowId={(row) => row.resident_id}
                density="compact"
                hideFooter
                disableRowSelectionOnClick
                getRowClassName={(params) => (params.row.status === "Waitlisted" ? "row-waitlisted" : "")}
                sx={{ "& .row-waitlisted": { opacity: 0.6 } }}
                localeText={{ noRowsLabel: "Nobody to show yet." }}
              />
            </Box>
          </Stack>
        )}

        {/* ── Step: Review ─────────────────────────────────────────────── */}
        {step === STEP_REVIEW && (
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
              {cameFromSelection
                ? "Creating this form requires admin confirmation, since the ranking decides who gets it."
                : "Who qualifies is decided when you create the form. It does not update if residents change later."}
            </Typography>
            {createError && <Alert severity="error">{createError}</Alert>}
          </Stack>
        )}

        {/* ── Result ─────────────────────────────────────────────────── */}
        {step === STEP_RESULT && result && (
          <Stack spacing={2} alignItems="center" sx={{ py: 3 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 56, color: "#2e7d32" }} />
            <Typography variant="h6" fontWeight={600}>
              Form created
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {result.message}
            </Typography>
            {result.selected_count !== undefined && (
              <Typography variant="body2" color="text.secondary">
                {result.selected_count} selected · {result.waitlisted_count} waitlisted
              </Typography>
            )}
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
          {step === STEP_DETAILS && (
            <>
              <Button onClick={handleClose}>Cancel</Button>
              <Button variant="contained" onClick={goFromDetails} sx={navyButtonSx}>
                Next
              </Button>
            </>
          )}
          {step === STEP_RECIPIENTS && (
            <>
              <Button onClick={() => setStep(STEP_DETAILS)}>Back</Button>
              <Button
                variant="contained"
                onClick={goFromRecipients}
                disabled={!canContinueFromRecipients}
                sx={navyButtonSx}
              >
                Next
              </Button>
            </>
          )}
          {step === STEP_SELECTION && (
            <>
              <Button onClick={() => setStep(STEP_RECIPIENTS)}>Back</Button>
              <Button
                variant="contained"
                onClick={goFromSelection}
                disabled={!canContinueFromSelection}
                sx={navyButtonSx}
              >
                Next
              </Button>
            </>
          )}
          {step === STEP_REVIEW && (
            <>
              <Button
                onClick={() => setStep(cameFromSelection ? STEP_SELECTION : STEP_RECIPIENTS)}
                disabled={createLoading}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={cameFromSelection ? () => setReAuthOpen(true) : handleCreate}
                disabled={createLoading}
                startIcon={createLoading ? <CircularProgress size={16} color="inherit" /> : null}
                sx={navyButtonSx}
              >
                {createLoading ? "Creating..." : "Create form"}
              </Button>
            </>
          )}
          {step === STEP_RESULT && (
            <Button variant="contained" onClick={handleClose} sx={navyButtonSx}>
              Done
            </Button>
          )}
        </Box>
      </DialogActions>

      {/* Admin re-auth — only forms that went through ranked selection need this */}
      <ReAuthModal
        open={reAuthOpen}
        onClose={handleReAuthClose}
        onConfirm={handleRankedCreate}
        loading={reAuthLoading}
        error={reAuthError}
        title="Confirm Ranked Selection"
        description={`This finalizes the ranking for "${details.form_name.trim()}" — ${selectedCountForReAuth} selected, ${waitlistedCountForReAuth} waitlisted. Enter your admin credentials to proceed.`}
        confirmLabel="Create form"
        confirmColor="primary"
      />
    </Dialog>
  );
};

export default CreateEligibilityFormModal;