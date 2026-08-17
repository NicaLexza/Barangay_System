// pages/DashboardPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Grid,
  Typography,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Tooltip,
  Chip,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
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
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Navbar from "../Reusables/Navbar.jsx";
import Footer from "../Reusables/Footer.jsx";
import ReAuthModal from "../modals/ReAuthModal.jsx";

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

const ACT_COLORS = {
  "Resident:added": "#2563eb",
  "Resident:updated": "#0369a1",
  "Household:added": "#16a34a",
  "Household:updated": "#15803d",
  "Account:created": "#7c3aed",
  "Eligibility Form:created": "#dc2626",
  "Database:backup_created": "#0891b2",
  "Database:restored": "#0891b2",
};

const RECORD_TYPE_STYLES = {
  Resident: { color: "#1d4ed8", bg: "#eff6ff", Icon: PeopleOutlineIcon },
  Household: { color: "#16a34a", bg: "#f0fdf4", Icon: HomeOutlinedIcon },
};

const pct = (n, total) =>
  total > 0 ? Math.round((Number(n) / Number(total)) * 100) : 0;

// Turns the backend's { residents, accounts, eligibility_forms, eligibility_entries }
// shape into one readable sentence, reused for both backup and restore snackbars.
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

const Dot = ({ color }) => (
  <Box
    component="span"
    sx={{
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: "50%",
      backgroundColor: color,
      flexShrink: 0,
      mt: "7px",
    }}
  />
);

const ActivityRow = ({ item, last }) => {
  const key = `${item.entity_type}:${item.action_type}`;
  const color = ACT_COLORS[key] ?? INK_3;
  const verbMap = {
    added: "added",
    created: "created",
    updated: "updated",
    imported: "imported",
    archived: "archived",
    restored: "restored",
    deleted: "deleted permanently",
    backup_created: "backed up",
  };
  const verb = verbMap[item.action_type] ?? item.action_type;
  return (
    <>
      <ListItem
        alignItems="flex-start"
        disablePadding
        sx={{ py: 1.25, gap: 1.25, display: "flex" }}
      >
        <Dot color={color} />
        <ListItemText
          disableTypography
          primary={
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              gap={1}
            >
              <Box minWidth={0}>
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: INK,
                    lineHeight: 1.35,
                  }}
                  noWrap
                >
                  {item.entity_name}
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", color: INK_3, mt: 0.25 }}>
                  {item.entity_type} {verb}
                  {item.performed_by ? ` · ${item.performed_by}` : ""}
                </Typography>
              </Box>
              <Tooltip
                title={dayjs(item.action_time).format("MMM D, YYYY h:mm A")}
                placement="left"
              >
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    color: INK_3,
                    whiteSpace: "nowrap",
                    cursor: "default",
                    mt: "1px",
                    flexShrink: 0,
                  }}
                >
                  {dayjs(item.action_time).fromNow()}
                </Typography>
              </Tooltip>
            </Box>
          }
        />
      </ListItem>
      {!last && <Divider sx={{ borderColor: BORDER }} />}
    </>
  );
};

// ─── Dashboard page ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loadS, setLoadS] = useState(true);
  const [loadA, setLoadA] = useState(true);

  // Backup re-auth flow state — mirrors the restore flow below. Backup now
  // requires the same credential confirmation restore already required,
  // instead of firing straight off the button click.
  const [backupReAuthOpen, setBackupReAuthOpen] = useState(false);
  const [backupReAuthLoading, setBackupReAuthLoading] = useState(false);
  const [backupReAuthError, setBackupReAuthError] = useState("");

  // Restore flow state
  const [restoreFile, setRestoreFile] = useState(null);
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [reAuthLoading, setReAuthLoading] = useState(false);
  const [reAuthError, setReAuthError] = useState("");
  const fileInputRef = useRef(null);

  // Shared result feedback for both backup and restore
  const [snackbar, setSnackbar] = useState({ open: false, severity: "success", message: "" });
  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const adminName = localStorage.getItem("username") ?? "Admin";
  const today = dayjs().format("dddd, MMMM D, YYYY");

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        "http://localhost:5000/api/dashboard/stats",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setStats(data);
    } catch (e) {
      console.error("Stats error:", e);
    } finally {
      setLoadS(false);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        "http://localhost:5000/api/dashboard/recent-activity",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setActivity(data);
    } catch (e) {
      console.error("Activity error:", e);
    } finally {
      setLoadA(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchActivity();
  }, [fetchStats, fetchActivity]);

  // ── Backup — now gated behind re-auth ─────────────────────────────────────
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

      const downloadRes = await axios.post(
        "http://localhost:5000/api/backup/download",
        { username, password },
        { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" },
      );

      const filename = `barangay_backup_${dayjs().format("YYYY-MM-DD_HHmmss")}.sql`;
      const blob = new Blob([downloadRes.data], { type: "application/sql" });

      setBackupReAuthOpen(false);
      fetchActivity();

      // showSaveFilePicker's promise only resolves AFTER the user actually
      // finishes the native save dialog — a real completion signal, unlike
      // an <a download> click which hands off to the browser instantly with
      // no way to know what happens next. Chrome/Edge/Opera desktop only;
      // Firefox and Safari don't implement it (Firefox has declined to).
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: "SQL backup", accept: { "application/sql": [".sql"] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();

          setSnackbar({
            open: true,
            severity: "success",
            message: `Backup saved — ${formatCountsSummary(counts)} backed up.`,
          });
        } catch (saveErr) {
          // AbortError = user clicked Cancel on the save dialog. That's not
          // a failure, just don't claim anything was saved.
          if (saveErr.name !== "AbortError") {
            console.error("Save error:", saveErr);
            setSnackbar({
              open: true,
              severity: "error",
              message: "Backup was generated but could not be saved to disk.",
            });
          }
        }
      } else {
        // Fallback for Firefox/Safari/mobile — no completion signal exists
        // here at all, so the message is worded to not claim the save is
        // done, only that it was handed off to the browser's downloader.
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setSnackbar({
          open: true,
          severity: "success",
          message: `Backup download started — ${formatCountsSummary(counts)} included. Check your browser's downloads to confirm it finished saving.`,
        });
      }
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

      const { counts, mismatches } = res.data;
      const hasMismatches = mismatches && mismatches.length > 0;

      let message;
      if (hasMismatches) {
        const detail = mismatches
          .map((m) => `${m.table}: ${m.actual} of ${m.expected} expected`)
          .join("; ");
        message = `Restore completed with differences — ${detail}. Some records may not have been restored; consider re-uploading the backup file.`;
      } else {
        message = counts
          ? `Database restored successfully — ${formatCountsSummary(counts)} restored.`
          : "Database restored successfully.";
      }

      // Stash in sessionStorage (not localStorage — that's about to be
      // wiped below) so LoginPage can show this AFTER the redirect lands.
      sessionStorage.setItem(
        "postRestoreNotice",
        JSON.stringify({
          severity: hasMismatches ? "warning" : "success",
          message,
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
            </Box>

            <Box display="flex" alignItems="center" gap={1.5}>
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
                accept=".sql"
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

          {/* ── Main two-column layout (flexbox — reliable in MUI v7) ── */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "stretch" }}>
            {/* ════════════════════════  LEFT COLUMN  (≈58%)  ════════════════════════ */}
            <Box sx={{ flex: "0 0 58%", minWidth: 0 }}>
              {/* Row 1 — four stat cards */}
              <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
                {statCards.map((c) => (
                  <Box key={c.label} sx={{ flex: 1, minWidth: 0 }}>
                    <StatCard {...c} loading={loadS} />
                  </Box>
                ))}
              </Box>

              {/* Row 2 — Age Distribution + Gender + Special Sectors */}
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
                        <Skeleton
                          height={13}
                          sx={{ mb: 0.5, borderRadius: 1 }}
                        />
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
                              <Typography
                                sx={{ fontSize: "0.66rem", color: INK_3 }}
                              >
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
                                backgroundColor:
                                  GENDER_COLORS[g.sex] ?? "#6b7280",
                                borderRadius: 4,
                                transition:
                                  "width 0.6s cubic-bezier(0.4,0,0.2,1)",
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
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={0.75}
                              >
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
                              <Box
                                display="flex"
                                alignItems="baseline"
                                gap={0.5}
                              >
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
                                <Typography
                                  sx={{ fontSize: "0.66rem", color: INK_3 }}
                                >
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

              {/* Row 3 — Recently Added Records */}
              <Box sx={{ ...card }}>
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
                                maxWidth: 160,
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
                            <TableCell
                              sx={{ pr: 2.5, borderColor: BORDER, py: 1.1 }}
                            >
                              <Tooltip
                                title={dayjs(r.created_at).format(
                                  "MMM D, YYYY h:mm A",
                                )}
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
            </Box>
            {/* end LEFT COLUMN */}

            {/* ════════════════════════  RIGHT COLUMN  (≈42%)  ═══════════════════════ */}
            <Box
              sx={{
                flex: "0 0 calc(42% - 8px)",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Row 1 — Mission + Vision side by side */}
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                {/* Mission */}
                <Box
                  sx={{
                    ...card,
                    p: 2.5,
                    flex: 1,
                    minWidth: 0,
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

                {/* Vision */}
                <Box
                  sx={{
                    ...card,
                    p: 2.5,
                    flex: 1,
                    minWidth: 0,
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

              {/* Row 2 — Recent Activity */}
              <Box
                sx={{
                  ...card,
                  display: "flex",
                  flexDirection: "column",
                  height: 733,
                }}
              >
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
                    Recent Activity
                  </Typography>
                  <Box display="flex" gap={0.75}>
                    {[
                      { color: "#2563eb", label: "Resident" },
                      { color: "#16a34a", label: "Household" },
                      { color: "#7c3aed", label: "Account" },
                      { color: "#0891b2", label: "Backup" },
                    ].map(({ color, label }) => (
                      <Tooltip key={label} title={label} placement="bottom">
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            backgroundColor: color,
                            cursor: "default",
                            mt: "2px",
                          }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>

                {/* ↓ scrollable content area that fills available space */}
                <Box
                  sx={{
                    px: 2,
                    ...thinScroll,
                    overflow: "auto",
                    flex: 1,
                    minHeight: 0,
                  }}
                >
                  {loadA ? (
                    <Box py={1.5}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <Box
                          key={i}
                          display="flex"
                          gap={1.25}
                          py={1.25}
                          alignItems="flex-start"
                        >
                          <Skeleton
                            variant="circular"
                            width={8}
                            height={8}
                            sx={{ mt: "7px", flexShrink: 0 }}
                          />
                          <Box flex={1}>
                            <Skeleton height={12} sx={{ mb: 0.4 }} />
                            <Skeleton height={10} width="55%" />
                          </Box>
                          <Skeleton
                            width={46}
                            height={10}
                            sx={{ flexShrink: 0 }}
                          />
                        </Box>
                      ))}
                    </Box>
                  ) : activity.length === 0 ? (
                    <Box py={4} textAlign="center">
                      <Typography sx={{ fontSize: "0.8rem", color: INK_3 }}>
                        No recent activity.
                      </Typography>
                    </Box>
                  ) : (
                    <List disablePadding>
                      {activity.map((item, i) => (
                        <ActivityRow
                          key={`${item.entity_type}-${item.action_type}-${i}`}
                          item={item}
                          last={i === activity.length - 1}
                        />
                      ))}
                    </List>
                  )}
                </Box>
              </Box>
            </Box>
            {/* end RIGHT COLUMN */}
          </Box>
          {/* end two-column flexbox */}

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

      {/* Result feedback for backup (restore's feedback is shown on LoginPage
          after the redirect — see postRestoreNotice in sessionStorage) */}
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