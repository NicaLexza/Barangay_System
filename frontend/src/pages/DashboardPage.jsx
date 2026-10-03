// pages/DashboardPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
  Tooltip,
  Chip,
  Button,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import HomeIcon from "@mui/icons-material/Home";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AccessibleIcon from "@mui/icons-material/Accessible";
import ElderlyIcon from "@mui/icons-material/Elderly";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import WcIcon from "@mui/icons-material/Wc";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import BackupIcon from "@mui/icons-material/Backup";
import RestoreIcon from "@mui/icons-material/Restore";
import ClearIcon from "@mui/icons-material/Clear";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import Navbar from "../Reusables/Navbar.jsx";
import Footer from "../Reusables/Footer.jsx";
import ReAuthModal from "../modals/ReAuthModal.jsx";
import BackupRestoreResultModal from "../modals/BackupRestoreResultModal.jsx";

dayjs.extend(relativeTime);

const NAVBAR_H = 64;
const FOOTER_H = 75;

const NAVY = "#002f59";
const NAVY_LIGHT = "#e8f0f8";
const INK = "#0f1c2e";
const INK_2 = "#4a5568";
const INK_3 = "#94a3b8";
const BORDER = "#e2e8f0";
const SURFACE = "#f7f9fc";
const WHITE = "#ffffff";

const AGE_COLORS = ["#1e3a5f", "#1d5096", "#2563eb", "#60a5fa", "#bfdbfe"];
const GENDER_COLORS = { Male: "#1d4ed8", Female: "#be185d", Other: "#047857" };

const RECORD_TYPE_STYLES = {
  Resident: { color: "#1d4ed8", bg: "#eff6ff", Icon: PeopleOutlineIcon },
  Head: { color: "#16a34a", bg: "#f0fdf4", Icon: HomeOutlinedIcon },
};

const pct = (n, total) =>
  total > 0 ? Math.round((Number(n) / Number(total)) * 100) : 0;

// Turns the backend's { residents, accounts, eligibility_forms, eligibility_entries }
// shape into one readable sentence.
const formatCountsSummary = (counts) => {
  if (!counts) return null;
  return `${counts.residents} residents, ${counts.accounts} accounts, ${counts.eligibility_forms} eligibility forms, and ${counts.eligibility_entries} entries`;
};

const thinScroll = {
  overflowY: "auto",
  "&::-webkit-scrollbar": { width: "3px" },
  "&::-webkit-scrollbar-track": { background: "transparent" },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(0,47,89,0.18)",
    borderRadius: "2px",
  },
  "&::-webkit-scrollbar-thumb:hover": { background: "rgba(0,47,89,0.4)" },
};

const card = {
  backgroundColor: WHITE,
  border: `1px solid ${BORDER}`,
  borderRadius: "12px",
  overflow: "hidden",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ children, sx = {} }) => (
  <Typography
    sx={{
      fontSize: "0.7rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: INK_3,
      mb: 1.5,
      ...sx,
    }}
  >
    {children}
  </Typography>
);

const StatCard = ({
  Icon,
  label,
  value,
  trend,
  trendPositive,
  loading,
  accent,
}) => (
  <Box
    sx={{
      ...card,
      p: 2.5,
      display: "flex",
      flexDirection: "column",
      gap: 1.25,
      position: "relative",
      "&::before": accent
        ? {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          backgroundColor: NAVY,
          borderRadius: "12px 0 0 12px",
        }
        : {},
    }}
  >
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "8px",
          backgroundColor: NAVY_LIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon sx={{ fontSize: 16, color: NAVY }} />
      </Box>
      {trend && !loading && (
        <Chip
          size="small"
          icon={<TrendingUpIcon sx={{ fontSize: "11px !important" }} />}
          label={trend}
          sx={{
            height: 20,
            fontSize: "0.65rem",
            fontWeight: 600,
            backgroundColor: trendPositive ? "#ecfdf5" : SURFACE,
            color: trendPositive ? "#16a34a" : INK_3,
            "& .MuiChip-icon": { color: trendPositive ? "#16a34a" : INK_3 },
            border: "none",
          }}
        />
      )}
    </Box>
    {loading ? (
      <Skeleton width={60} height={40} sx={{ borderRadius: 1 }} />
    ) : (
      <Typography
        sx={{
          fontSize: "2.25rem",
          fontWeight: 700,
          lineHeight: 1,
          color: INK,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.03em",
        }}
      >
        {value ?? 0}
      </Typography>
    )}
    <Typography sx={{ fontSize: "0.75rem", fontWeight: 500, color: INK_2 }}>
      {label}
    </Typography>
  </Box>
);

const BarRow = ({ label, count, total, color, loading }) => {
  const p = pct(count, total);
  return (
    <Box mb={1.5}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={0.5}
      >
        <Typography sx={{ fontSize: "0.75rem", color: INK_2, fontWeight: 500 }}>
          {label}
        </Typography>
        {loading ? (
          <Skeleton width={44} height={13} />
        ) : (
          <Box display="flex" alignItems="baseline" gap={0.4}>
            <Typography
              sx={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: INK,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {count}
            </Typography>
            <Typography sx={{ fontSize: "0.66rem", color: INK_3 }}>
              {p}%
            </Typography>
          </Box>
        )}
      </Box>
      {loading ? (
        <Skeleton height={6} sx={{ borderRadius: 4 }} />
      ) : (
        <Box
          sx={{
            height: 6,
            borderRadius: 4,
            backgroundColor: `${color}18`,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: `${p}%`,
              height: "100%",
              backgroundColor: color,
              borderRadius: 4,
              transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </Box>
      )}
    </Box>
  );
};

// ─── Dashboard page ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loadS, setLoadS] = useState(true);

  // Custom date-range filter — scopes every resident-based stat card and
  // chart to a strict window (created_at BETWEEN dateFrom AND dateTo)
  // instead of the default all-time cumulative view. Recently Added Records
  // is intentionally NEVER affected by this filter (see dashboardController.js).
  const [dateFrom, setDateFrom] = useState(null); // dayjs | null
  const [dateTo, setDateTo] = useState(null);     // dayjs | null
  const hasDateFilter = !!(dateFrom && dateTo);

  // Archived residents are excluded from every resident-based figure
  // (cards, breakdowns, Recently Added) unless this is checked.
  const [includeArchived, setIncludeArchived] = useState(false);

  // Backup re-auth flow state — mirrors the restore flow below.
  const [backupReAuthOpen, setBackupReAuthOpen] = useState(false);
  const [backupReAuthLoading, setBackupReAuthLoading] = useState(false);
  const [backupReAuthError, setBackupReAuthError] = useState("");

  // Restore flow state
  const [restoreFile, setRestoreFile] = useState(null);
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [reAuthLoading, setReAuthLoading] = useState(false);
  const [reAuthError, setReAuthError] = useState("");
  const fileInputRef = useRef(null);

  // Transient feedback (e.g. a local disk-save failure)
  const [snackbar, setSnackbar] = useState({ open: false, severity: "success", message: "" });
  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  // Durable results modal for backup — shown every time a backup finishes
  // (success or warning). Restore's equivalent is rendered on LoginPage
  // after the forced redirect (see postRestoreNotice). Past reports can
  // still be re-opened from the Audit Logs page.
  const [backupResult, setBackupResult] = useState(null); // { report, filename, saveNote, requestedSummary } | null

  const adminName = localStorage.getItem("username") ?? "Admin";
  const today = dayjs().format("dddd, MMMM D, YYYY");

  // Accepts an optional { startDate, endDate } ('YYYY-MM-DD' strings) —
  // when omitted, the backend returns the default all-time cumulative view —
  // and an includeArchived flag (omitted from the request when false, since
  // the backend default is active-only).
  const fetchStats = useCallback(async (range, withArchived = false) => {
    setLoadS(true);
    try {
      const token = localStorage.getItem("token");
      const params = {};
      if (withArchived) params.includeArchived = true;
      if (range?.startDate && range?.endDate) {
        params.startDate = range.startDate;
        params.endDate = range.endDate;
      }
      const { data } = await axios.get(
        "http://localhost:5000/api/dashboard/stats",
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        },
      );
      setStats(data);
    } catch (e) {
      console.error("Stats error:", e);
    } finally {
      setLoadS(false);
    }
  }, []);

  // Stats refetch whenever the date range or the archived toggle changes —
  // including on mount (no range, active-only).
  useEffect(() => {
    if (hasDateFilter) {
      fetchStats(
        {
          startDate: dateFrom.format("YYYY-MM-DD"),
          endDate: dateTo.format("YYYY-MM-DD"),
        },
        includeArchived,
      );
    } else {
      fetchStats(undefined, includeArchived);
    }
  }, [dateFrom, dateTo, hasDateFilter, includeArchived, fetchStats]);

  const clearDateFilter = () => {
    setDateFrom(null);
    setDateTo(null);
  };

  // ── Backup — gated behind re-auth ─────────────────────────────────────────
  const handleBackupReAuthClose = () => {
    if (backupReAuthLoading) return;
    setBackupReAuthOpen(false);
    setBackupReAuthError("");
  };

  const handleBackupConfirm = async ({ username, password }) => {
    setBackupReAuthLoading(true);
    setBackupReAuthError("");

    try {
      const token = localStorage.getItem("token");

      const summaryRes = await axios.post(
        "http://localhost:5000/api/backup/summary",
        { username, password },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const counts = summaryRes.data.counts;

      // Step 2: generate + verify server-side. Returns JSON (not a file) —
      // the dump is buffered and diffed against the live DB before the
      // browser ever starts downloading anything.
      const generateRes = await axios.post(
        "http://localhost:5000/api/backup/generate",
        { username, password },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const { token: downloadToken, filename, verification } = generateRes.data;

      // Step 3: fetch the already-generated, already-verified file bytes.
      const downloadRes = await axios.get(
        `http://localhost:5000/api/backup/download/${downloadToken}`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" },
      );

      const blob = new Blob([downloadRes.data], { type: "application/octet-stream" });
      const saveFilename = `${filename}.enc`;

      setBackupReAuthOpen(false);

      // The verification report (success or warning) is already final and
      // already persisted to activity_logs.details. Everything below only
      // affects whether the file made it to disk, surfaced as `saveNote`
      // inside the same results modal.
      let saveNote = "";

      // showSaveFilePicker's promise only resolves AFTER the user actually
      // finishes the native save dialog — a real completion signal, unlike
      // an <a download> click. Chrome/Edge/Opera desktop only.
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: saveFilename,
            types: [{ description: "Encrypted SQL backup", accept: { "application/octet-stream": [".enc"] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();

          saveNote = `Saved to disk as "${saveFilename}".`;
        } catch (saveErr) {
          // AbortError = user clicked Cancel on the save dialog. That's not
          // a failure of the backup itself.
          if (saveErr.name !== "AbortError") {
            console.error("Save error:", saveErr);
            setSnackbar({
              open: true,
              severity: "error",
              message: "Backup was generated and verified, but could not be saved to disk.",
            });
          } else {
            saveNote = "Save was cancelled — the backup was still generated and verified.";
          }
        }
      } else {
        // Fallback for Firefox/Safari/mobile — no completion signal exists,
        // so the note doesn't claim the save is done.
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = saveFilename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        saveNote = "Download started — check your browser's downloads to confirm it finished saving.";
      }

      setBackupResult({
        report: verification,
        filename: saveFilename,
        saveNote,
        requestedSummary: formatCountsSummary(counts),
      });
    } catch (err) {
      console.error("Backup error:", err);
      let message = "Failed to generate backup. Please try again.";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          message = parsed.message || message;
        } catch {
          // Response wasn't JSON — fall back to the default message above.
        }
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }
      setBackupReAuthError(message);
    } finally {
      setBackupReAuthLoading(false);
    }
  };

  // ── Restore ─────────────────────────────────────────────────────────────
  const handleRestoreFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRestoreFile(file);
      setReAuthError("");
      setReAuthOpen(true);
    }
    e.target.value = ""; // allow re-selecting the same file later
  };

  const handleRestoreClose = () => {
    if (reAuthLoading) return;
    setReAuthOpen(false);
    setRestoreFile(null);
    setReAuthError("");
  };

  const handleRestoreConfirm = async ({ username, password }) => {
    if (!restoreFile) return;
    setReAuthLoading(true);
    setReAuthError("");

    try {
      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("file", restoreFile);
      form.append("username", username);
      form.append("password", password);

      const res = await axios.post("http://localhost:5000/api/backup/restore", form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const { verification } = res.data;

      // Stash in sessionStorage (not localStorage — that's about to be
      // wiped below) so LoginPage can show the full results modal AFTER
      // the forced redirect lands.
      sessionStorage.setItem(
        "postRestoreNotice",
        JSON.stringify({
          report: verification,
          filename: restoreFile?.name,
        }),
      );

      localStorage.clear();
      window.location.href = "/";
    } catch (err) {
      setReAuthError(
        err.response?.data?.message || "Restore failed. Please try again.",
      );
    } finally {
      setReAuthLoading(false);
    }
  };

  const counts = stats?.counts ?? {};
  const ageDist = stats?.ageDistribution ?? {};
  const genders = stats?.genderBreakdown ?? [];
  const sectors = stats?.specialSectors ?? {};
  const records = stats?.recentRecords ?? [];
  const civil = stats?.civilStatus ?? [];

  const totalR = Number(counts.total_residents ?? 0);
  const totalG = genders.reduce((s, g) => s + Number(g.count), 0);

  const ageGroups = [
    { label: "Minor (0–17)", value: ageDist.age_0_17, color: AGE_COLORS[0] },
    {
      label: "Young Adult (18–30)",
      value: ageDist.age_18_30,
      color: AGE_COLORS[1],
    },
    { label: "Adult (31–45)", value: ageDist.age_31_45, color: AGE_COLORS[2] },
    { label: "Mature (46–60)", value: ageDist.age_46_60, color: AGE_COLORS[3] },
    {
      label: "Elderly (60+)",
      value: ageDist.age_60_plus,
      color: AGE_COLORS[4],
    },
  ];

  const sectorRows = [
    {
      Icon: AccessibleIcon,
      label: "Person with Disability",
      key: "pwd_count",
      color: "#7c3aed",
    },
    {
      Icon: ElderlyIcon,
      label: "Senior Citizen",
      key: "senior_count",
      color: "#0369a1",
    },
    {
      Icon: FamilyRestroomIcon,
      label: "Solo Parent",
      key: "solop_count",
      color: "#16a34a",
    },
  ];

  const statCards = [
    {
      Icon: PeopleAltIcon,
      label: "Total Residents",
      value: counts.total_residents,
      accent: true,
      trend:
        counts.residents_this_month > 0
          ? `+${counts.residents_this_month} this month`
          : null,
      trendPositive: true,
    },
    {
      Icon: HomeIcon,
      label: "Household Heads",
      value: counts.total_households,
      accent: true,
      trend:
        counts.households_this_month > 0
          ? `+${counts.households_this_month} this month`
          : null,
      trendPositive: true,
    },
    {
      Icon: ManageAccountsIcon,
      label: "Active Accounts",
      value: counts.active_users,
      accent: true,
      trend: "Currently active",
      trendPositive: false,
    },
    {
      Icon: AssignmentIcon,
      label: "Eligibility Forms",
      value: counts.active_forms,
      accent: true,
      trend: counts.total_forms ? `${counts.total_forms} total` : null,
      trendPositive: false,
    },
  ];

  return (
    <>
      <Navbar />
      <Footer />

      <Box
        sx={{
          position: "fixed",
          top: NAVBAR_H,
          left: 0,
          right: 0,
          bottom: FOOTER_H,
          ...thinScroll,
        }}
      >
        <Box
          sx={{
            maxWidth: 1400,
            mx: "auto",
            px: { xs: 2, sm: 3, md: 4 },
            py: 3,
          }}
        >
          {/* ── Page header ─────────────────────────────────────── */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-end"
            flexWrap="wrap"
            gap={1.5}
            mb={3}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  color: NAVY,
                  mb: 0.5,
                }}
              >
                Overview
              </Typography>
              <Typography
                sx={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: INK,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                }}
              >
                Dashboard
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", color: INK_3, mt: 0.4 }}>
                Welcome back, {adminName}
              </Typography>
              {hasDateFilter && (
                <Typography sx={{ fontSize: "0.75rem", color: NAVY, fontWeight: 600, mt: 0.4 }}>
                  Showing {dateFrom.format("MMM D, YYYY")} – {dateTo.format("MMM D, YYYY")}
                </Typography>
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
              {/* Custom date-range filter — resident stat cards, age/gender/
                  civil-status breakdowns, and special sectors all scope to
                  this range (strict window) when both dates are set.
                  Recently Added Records intentionally ignores it. */}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="From"
                  value={dateFrom}
                  onChange={setDateFrom}
                  format="MM/DD/YYYY"
                  maxDate={dateTo || undefined}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: 150, backgroundColor: WHITE, borderRadius: 1 },
                    },
                  }}
                />
                <DatePicker
                  label="To"
                  value={dateTo}
                  onChange={setDateTo}
                  format="MM/DD/YYYY"
                  minDate={dateFrom || undefined}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: 150, backgroundColor: WHITE, borderRadius: 1 },
                    },
                  }}
                />
              </LocalizationProvider>
              {hasDateFilter && (
                <IconButton
                  size="small"
                  onClick={clearDateFilter}
                  title="Clear date filter"
                  sx={{
                    color: INK_3,
                    backgroundColor: WHITE,
                    border: `1px solid ${BORDER}`,
                    "&:hover": { backgroundColor: SURFACE },
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}

              <FormControlLabel
                sx={{
                  m: 0,
                  pr: 1.5,
                  backgroundColor: WHITE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                }}
                control={
                  <Checkbox
                    size="small"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                  />
                }
                label={
                  <Typography sx={{ fontSize: "0.78rem", color: INK_2, fontWeight: 500 }}>
                    Include archived residents
                  </Typography>
                }
              />

              <Box
                sx={{
                  backgroundColor: WHITE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                  px: 2,
                  py: 1,
                }}
              >
                <Typography
                  sx={{ fontSize: "0.78rem", color: INK_2, fontWeight: 500 }}
                >
                  {today}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                startIcon={<BackupIcon sx={{ fontSize: 16 }} />}
                onClick={() => setBackupReAuthOpen(true)}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: NAVY,
                  color: NAVY,
                  fontSize: "0.78rem",
                  backgroundColor: WHITE,
                  "&:hover": { backgroundColor: NAVY_LIGHT },
                }}
              >
                Backup Database
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".sql,.enc"
                style={{ display: "none" }}
                onChange={handleRestoreFileChange}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<RestoreIcon sx={{ fontSize: 16 }} />}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#dc2626",
                  color: "#dc2626",
                  fontSize: "0.78rem",
                  backgroundColor: WHITE,
                  "&:hover": { backgroundColor: "#fef2f2" },
                }}
              >
                Restore Database
              </Button>
            </Box>
          </Box>

          {/* Row 1 — four stat cards (full width) */}
          <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
            {statCards.map((c) => (
              <Box key={c.label} sx={{ flex: 1, minWidth: 0 }}>
                <StatCard {...c} loading={loadS} />
              </Box>
            ))}
          </Box>

          {/* Row 2 — Age Distribution + Gender + Special Sectors/Civil Status */}
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            {/* Age Distribution */}
            <Box sx={{ ...card, p: 2.5, flex: 1, minWidth: 0 }}>
              <SectionLabel>Age Distribution</SectionLabel>
              {ageGroups.map((g) => (
                <BarRow
                  key={g.label}
                  label={g.label}
                  count={Number(g.value ?? 0)}
                  total={totalR}
                  color={g.color}
                  loading={loadS}
                />
              ))}
              <Box
                sx={{
                  mt: 1.25,
                  pt: 1.25,
                  borderTop: `1px solid ${BORDER}`,
                }}
              >
                <Typography sx={{ fontSize: "0.7rem", color: INK_3 }}>
                  {totalR} residents total
                </Typography>
              </Box>
            </Box>

            {/* Gender */}
            <Box sx={{ ...card, p: 2.5, flex: 1, minWidth: 0 }}>
              <SectionLabel>Gender</SectionLabel>
              {loadS ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Box key={i} mb={1.5}>
                    <Skeleton height={13} sx={{ mb: 0.5, borderRadius: 1 }} />
                    <Skeleton height={6} sx={{ borderRadius: 4 }} />
                  </Box>
                ))
              ) : genders.length === 0 ? (
                <Typography sx={{ fontSize: "0.8rem", color: INK_3 }}>
                  No data.
                </Typography>
              ) : (
                genders.map((g) => {
                  const GIcon =
                    g.sex === "Male"
                      ? MaleIcon
                      : g.sex === "Female"
                        ? FemaleIcon
                        : WcIcon;
                  return (
                    <Box key={g.sex} mb={1.5}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={0.5}
                      >
                        <Box display="flex" alignItems="center" gap={0.6}>
                          <GIcon
                            sx={{
                              fontSize: 14,
                              color: GENDER_COLORS[g.sex] ?? INK_3,
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: "0.75rem",
                              color: INK_2,
                              fontWeight: 500,
                            }}
                          >
                            {g.sex}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="baseline" gap={0.4}>
                          <Typography
                            sx={{
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              color: INK,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {g.count}
                          </Typography>
                          <Typography sx={{ fontSize: "0.66rem", color: INK_3 }}>
                            {pct(g.count, totalG)}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          height: 6,
                          borderRadius: 4,
                          backgroundColor: `${GENDER_COLORS[g.sex] ?? "#6b7280"}18`,
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            width: `${pct(g.count, totalG)}%`,
                            height: "100%",
                            backgroundColor: GENDER_COLORS[g.sex] ?? "#6b7280",
                            borderRadius: 4,
                            transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>

            {/* Special Sectors + Civil Status */}
            <Box sx={{ ...card, p: 2.5, flex: 1, minWidth: 0 }}>
              <SectionLabel>Special Sectors</SectionLabel>
              {loadS
                ? Array.from({ length: 3 }).map((_, i) => (
                  <Box
                    key={i}
                    display="flex"
                    justifyContent="space-between"
                    py={1.1}
                  >
                    <Skeleton width={120} height={15} />
                    <Skeleton width={36} height={15} />
                  </Box>
                ))
                : sectorRows.map(({ Icon, label, key, color }, i) => {
                  const count = Number(sectors[key] ?? 0);
                  const p = pct(count, totalR);
                  return (
                    <Box key={key}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        py={1.1}
                      >
                        <Box display="flex" alignItems="center" gap={0.75}>
                          <Box
                            sx={{
                              width: 26,
                              height: 26,
                              borderRadius: "6px",
                              backgroundColor: `${color}18`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Icon sx={{ fontSize: 14, color }} />
                          </Box>
                          <Typography
                            sx={{
                              fontSize: "0.76rem",
                              color: INK_2,
                              fontWeight: 500,
                            }}
                          >
                            {label}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="baseline" gap={0.5}>
                          <Typography
                            sx={{
                              fontSize: "1rem",
                              fontWeight: 700,
                              color: INK,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {count}
                          </Typography>
                          <Typography sx={{ fontSize: "0.66rem", color: INK_3 }}>
                            {p}%
                          </Typography>
                        </Box>
                      </Box>
                      {i < sectorRows.length - 1 && (
                        <Divider sx={{ borderColor: BORDER }} />
                      )}
                    </Box>
                  );
                })}

              <Divider sx={{ borderColor: BORDER, my: 1.5 }} />
              <SectionLabel sx={{ mb: 1 }}>Civil Status</SectionLabel>
              <Box display="flex" flexWrap="wrap" gap={0.6}>
                {loadS
                  ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      width={72}
                      height={24}
                      sx={{ borderRadius: "5px" }}
                    />
                  ))
                  : civil.map((c) => (
                    <Box
                      key={c.civil_status}
                      sx={{
                        px: 1,
                        py: 0.35,
                        border: `1px solid ${BORDER}`,
                        borderRadius: "5px",
                        backgroundColor: SURFACE,
                        display: "flex",
                        gap: 0.6,
                        alignItems: "baseline",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          color: INK_2,
                          fontWeight: 500,
                        }}
                      >
                        {c.civil_status}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: INK,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {c.count}
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </Box>
          </Box>

          {/* Row 3 — Recently Added Records (~2/3) beside Mission + Vision (~1/3) */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "stretch" }}>
            {/* Recently Added Records */}
            <Box sx={{ ...card, flex: 2, minWidth: 0 }}>
              <Box
                sx={{
                  px: 2.5,
                  py: 1.75,
                  borderBottom: `1px solid ${BORDER}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: INK,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Recently Added Records
                </Typography>
                <Typography sx={{ fontSize: "0.68rem", color: INK_3 }}>
                  Last 10
                </Typography>
              </Box>

              {loadS ? (
                <Box px={2.5} py={2}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      height={36}
                      sx={{ mb: 0.5, borderRadius: 1 }}
                    />
                  ))}
                </Box>
              ) : records.length === 0 ? (
                <Box px={2.5} py={4} textAlign="center">
                  <Typography sx={{ fontSize: "0.8rem", color: INK_3 }}>
                    No records yet.
                  </Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: SURFACE }}>
                      {["Name", "Type", "Added"].map((h) => (
                        <TableCell
                          key={h}
                          sx={{
                            fontSize: "0.63rem",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: INK_3,
                            borderBottom: `1px solid ${BORDER}`,
                            py: 1,
                            "&:first-of-type": { pl: 2.5 },
                            "&:last-of-type": { pr: 2.5 },
                          }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records.map((r, idx) => {
                      const ts = RECORD_TYPE_STYLES[r.type] ?? {
                        color: INK_3,
                        bg: SURFACE,
                        Icon: PeopleOutlineIcon,
                      };
                      const TIcon = ts.Icon;
                      return (
                        <TableRow
                          key={`${r.type}-${r.id ?? idx}`}
                          sx={{
                            "&:last-child td": { border: 0 },
                            "&:hover td": { backgroundColor: SURFACE },
                            transition: "background 0.1s",
                            cursor: "default",
                          }}
                        >
                          <TableCell
                            sx={{
                              pl: 2.5,
                              py: 1.1,
                              borderColor: BORDER,
                              maxWidth: 220,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                color: INK,
                              }}
                              noWrap
                            >
                              {r.name}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ borderColor: BORDER, py: 1.1 }}>
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.4,
                                px: 0.75,
                                py: 0.2,
                                borderRadius: "5px",
                                backgroundColor: ts.bg,
                              }}
                            >
                              <TIcon sx={{ fontSize: 11, color: ts.color }} />
                              <Typography
                                sx={{
                                  fontSize: "0.68rem",
                                  fontWeight: 600,
                                  color: ts.color,
                                }}
                              >
                                {r.type}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ pr: 2.5, borderColor: BORDER, py: 1.1 }}>
                            <Tooltip
                              title={dayjs(r.created_at).format("MMM D, YYYY h:mm A")}
                              placement="left"
                            >
                              <Typography
                                sx={{
                                  fontSize: "0.72rem",
                                  color: INK_3,
                                  cursor: "default",
                                }}
                                noWrap
                              >
                                {dayjs(r.created_at).fromNow()}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Box>

            {/* Mission + Vision, stacked */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  ...card,
                  p: 2.5,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: INK,
                    textAlign: "center",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Mission
                </Typography>
                <Divider sx={{ borderColor: BORDER }} />
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: INK_2,
                    lineHeight: 1.75,
                    textAlign: "justify",
                  }}
                >
                  To develop a vibrant community led by competent, dynamic,
                  and committed leaders with family-oriented, caring, loving,
                  healthy, secured, and empowered people living harmoniously
                  and sustainably managing the social environment.
                </Typography>
              </Box>

              <Box
                sx={{
                  ...card,
                  p: 2.5,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: INK,
                    textAlign: "center",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Vision
                </Typography>
                <Divider sx={{ borderColor: BORDER }} />
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: INK_2,
                    lineHeight: 1.75,
                    textAlign: "justify",
                  }}
                >
                  To create a community of sustainable growth through the
                  provision of effective and efficient services for local
                  governance that will improve the quality of life of the
                  people in the Barangay.
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box pb={3} />
        </Box>
      </Box>

      {/* Backup re-auth — same credential-confirmation pattern as restore */}
      <ReAuthModal
        open={backupReAuthOpen}
        onClose={handleBackupReAuthClose}
        onConfirm={handleBackupConfirm}
        loading={backupReAuthLoading}
        error={backupReAuthError}
        title="Confirm Database Backup"
        description="Enter your admin credentials to generate and download a full database backup."
        confirmLabel="Backup Database"
        confirmColor="primary"
      />

      {/* Restore re-auth — destructive action, requires re-entering admin credentials */}
      <ReAuthModal
        open={reAuthOpen}
        onClose={handleRestoreClose}
        onConfirm={handleRestoreConfirm}
        loading={reAuthLoading}
        error={reAuthError}
        title="Confirm Database Restore"
        description={`This will completely overwrite ALL current data — residents, accounts, eligibility forms, everything — with the contents of "${restoreFile?.name}". This cannot be undone. Enter your admin credentials to proceed.`}
        confirmLabel="Restore Database"
        confirmColor="error"
      />

      {/* Durable backup results — shown every time a backup finishes, success
          or warning. Restore's equivalent renders on LoginPage after the
          forced redirect — see postRestoreNotice in sessionStorage. */}
      <BackupRestoreResultModal
        open={!!backupResult}
        onClose={() => setBackupResult(null)}
        operation="backup"
        report={backupResult?.report}
        filename={backupResult?.filename}
        saveNote={backupResult?.saveNote}
        requestedSummary={backupResult?.requestedSummary}
      />

      {/* Snackbar is reserved for transient, non-verification issues
          (e.g. a local disk-save failure). */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={7000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ maxWidth: 480 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Dashboard;