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
  Collapse,
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
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
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

const ACT_COLORS = {
  "Resident:added": "#2563eb",
  "Resident:updated": "#0369a1",
  "Resident:imported": "#2563eb",
  "Household:added": "#16a34a",
  "Household:updated": "#15803d",
  "Account:created": "#7c3aed",
  "Eligibility Form:created": "#dc2626",
  "Eligibility Form:enabled": "#16a34a",
  "Eligibility Form:disabled": "#64748b",
  "Database:backup_created": "#0891b2",
  "Database:restored": "#0891b2",
};

const RECORD_TYPE_STYLES = {
  Resident: { color: "#1d4ed8", bg: "#eff6ff", Icon: PeopleOutlineIcon },
  Head: { color: "#16a34a", bg: "#f0fdf4", Icon: HomeOutlinedIcon },
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

// Renders one updated resident's before/after diff inside a batch import's
// collapsible detail — same visual language as the single-record changes
// diff below, just nested under the resident's name so it's clear which
// record each line belongs to.
const BatchUpdateDiff = ({ name, changes }) => (
  <Box sx={{ mb: 1 }}>
    <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: INK, mb: 0.35 }}>
      {name}
    </Typography>
    {changes && changes.length > 0 ? (
      changes.map((c, idx) => (
        <Box
          key={idx}
          display="flex"
          alignItems="baseline"
          gap={1}
          sx={{ pl: 1, mb: idx !== changes.length - 1 ? 0.35 : 0 }}
        >
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: INK_2, minWidth: 76 }}>
            {c.field}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} flex={1} minWidth={0}>
            <Typography
              sx={{ fontSize: "0.68rem", color: INK_3, textDecoration: "line-through", opacity: 0.7 }}
              noWrap
            >
              {c.from || "(empty)"}
            </Typography>
            <Typography sx={{ fontSize: "0.68rem", color: INK_3 }}>→</Typography>
            <Typography sx={{ fontSize: "0.68rem", color: INK, fontWeight: 500 }} noWrap>
              {c.to || "(empty)"}
            </Typography>
          </Box>
        </Box>
      ))
    ) : (
      <Typography sx={{ fontSize: "0.68rem", color: INK_3, pl: 1, fontStyle: "italic" }}>
        No field changes recorded
      </Typography>
    )}
  </Box>
);

const ActivityRow = ({ item, last, onViewReport }) => {
  const [expanded, setExpanded] = useState(false);
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
    enabled: "Enabled",
    disabled: "Disabled",
  };
  
  const verb = verbMap[item.action_type] ?? item.action_type;
  
  let changes = [];
  if (item.changes) {
    try {
      changes = JSON.parse(item.changes);
    } catch (e) {
      console.error("Failed to parse changes:", e);
    }
  }

  const hasChanges = changes.length > 0;

  // Bulk-import log entries (one row per whole import, not per resident —
  // see residentImportConfirmController.js) carry their added/updated
  // breakdown in `details` instead of `changes`, distinguished by having
  // no single entity_id (it represents many records, not one).
  let importBatch = null;
  if (
    item.entity_type === "Resident" &&
    item.action_type === "imported" &&
    item.entity_id == null &&
    item.details
  ) {
    try {
      const parsed = JSON.parse(item.details);
      if (parsed && (Array.isArray(parsed.added) || Array.isArray(parsed.updated))) {
        importBatch = parsed;
      }
    } catch (e) {
      console.error("Failed to parse import batch details:", e);
    }
  }
  const hasImportBatch =
    !!importBatch &&
    ((importBatch.added?.length || 0) + (importBatch.updated?.length || 0) > 0);

  // Backup/restore rows carry their verification report in `details` —
  // parsed here so "VIEW REPORT" can reopen the exact same modal that
  // showed right after the operation, without re-running anything.
  let report = null;
  if (item.entity_type === "Database" && item.details) {
    try {
      report = JSON.parse(item.details);
    } catch (e) {
      console.error("Failed to parse activity details:", e);
    }
  }
  const hasReport = !!report;

  const hasExpandableDetail = hasChanges || hasImportBatch;

  return (
    <>
      <ListItem
        alignItems="flex-start"
        disablePadding
        sx={{ py: 1.25, gap: 1.25, display: "flex", flexDirection: "column" }}
      >
        <Box display="flex" width="100%" gap={1.25}>
          <Dot color={color} />
          <ListItemText
            disableTypography
            sx={{ m: 0 }}
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
                  <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
                    <Typography sx={{ fontSize: "0.7rem", color: INK_3 }}>
                      {item.entity_type} {verb}
                      {item.performed_by ? ` · ${item.performed_by}` : ""}
                    </Typography>
                    {hasExpandableDetail && (
                      <Box
                        onClick={() => setExpanded(!expanded)}
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          color: color,
                          cursor: "pointer",
                          ml: 0.5,
                          "&:hover": { opacity: 0.8 }
                        }}
                      >
                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, }}>
                          {expanded ? "HIDE DETAILS" : "SHOW DETAILS"}
                        </Typography>
                        {expanded ? (
                          <KeyboardArrowUpIcon sx={{ fontSize: 14 }} />
                        ) : (
                          <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />
                        )}
                      </Box>
                    )}
                    {hasReport && (
                      <Box
                        onClick={() =>
                          onViewReport?.({
                            report,
                            operation: item.action_type === "backup_created" ? "backup" : "restore",
                            filename: item.entity_name,
                          })
                        }
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          color: "#0891b2",
                          cursor: "pointer",
                          ml: 0.5,
                          "&:hover": { opacity: 0.8 }
                        }}
                      >
                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 600 }}>
                          VIEW REPORT
                        </Typography>
                      </Box>
                    )}
                  </Box>
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
        </Box>
        
        {/* Expanded detail — either a single record's field diff, or a
            batch import's added-names + updated-diffs breakdown. The two
            are mutually exclusive (different entity_type/action_type
            combinations produce each), so only one ever renders. */}
        {hasExpandableDetail && (
          <Collapse in={expanded} timeout="auto" unmountOnExit sx={{ width: "100%", pl: 2.75 }}>
            <Box
              sx={{
                mt: 0.5,
                p: 1.25,
                backgroundColor: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: "6px",
              }}
            >
              {hasChanges && changes.map((c, idx) => (
                <Box 
                  key={idx} 
                  display="flex" 
                  alignItems="baseline" 
                  gap={1}
                  sx={{ mb: idx !== changes.length - 1 ? 0.5 : 0 }}
                >
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: INK_2, minWidth: 80 }}>
                    {c.field}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} flex={1} minWidth={0}>
                    <Typography 
                      sx={{ 
                        fontSize: "0.7rem", 
                        color: INK_3,
                        textDecoration: "line-through",
                        opacity: 0.7
                      }}
                      noWrap
                    >
                      {c.from || "(empty)"}
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: INK_3 }}>→</Typography>
                    <Typography 
                      sx={{ 
                        fontSize: "0.7rem", 
                        color: INK,
                        fontWeight: 500
                      }}
                      noWrap
                    >
                      {c.to || "(empty)"}
                    </Typography>
                  </Box>
                </Box>
              ))}

              {hasImportBatch && (
                <>
                  {importBatch.added?.length > 0 && (
                    <Box sx={{ mb: importBatch.updated?.length > 0 ? 1.25 : 0 }}>
                      <Typography
                        sx={{
                          fontSize: "0.66rem",
                          fontWeight: 700,
                          color: INK_3,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          mb: 0.5,
                        }}
                      >
                        Added ({importBatch.added.length})
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: INK_2, lineHeight: 1.6 }}>
                        {importBatch.added.map((r) => r.name).join(", ")}
                      </Typography>
                    </Box>
                  )}

                  {importBatch.updated?.length > 0 && (
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "0.66rem",
                          fontWeight: 700,
                          color: INK_3,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          mb: 0.5,
                        }}
                      >
                        Updated ({importBatch.updated.length})
                      </Typography>
                      {importBatch.updated.map((r) => (
                        <BatchUpdateDiff key={r.resident_id} name={r.name} changes={r.changes} />
                      ))}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Collapse>
        )}
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

  // Durable results modal for backup — shown every time a backup finishes
  // (success or warning), independent of the transient save-to-disk
  // outcome captured separately in `saveNote`. Restore's equivalent is
  // rendered on LoginPage after the forced redirect (see postRestoreNotice).
  const [backupResult, setBackupResult] = useState(null); // { report, filename, saveNote, requestedSummary } | null

  // Re-opens the same results modal for a PAST backup/restore, using the
  // report already persisted in activity_logs.details — kept as separate
  // state from backupResult since a historical view has no saveNote or
  // requestedSummary (those only exist right after a fresh operation).
  const [activityReportView, setActivityReportView] = useState(null); // { report, operation, filename } | null

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

      // Step 2: generate + verify server-side. Returns JSON (not a file) —
      // the dump is buffered and diffed against the live DB before the
      // browser ever starts downloading anything, so a discrepancy is
      // known upfront instead of only being discoverable after the fact.
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
      fetchActivity();

      // The verification report (success or warning) is already final —
      // it was computed server-side before this point, and is already
      // persisted to activity_logs.details. Everything below only affects
      // whether the file made it to disk, which is a separate concern
      // surfaced as `saveNote` inside the same results modal rather than
      // a second, competing message.
      let saveNote = "";

      // showSaveFilePicker's promise only resolves AFTER the user actually
      // finishes the native save dialog — a real completion signal, unlike
      // an <a download> click which hands off to the browser instantly with
      // no way to know what happens next. Chrome/Edge/Opera desktop only;
      // Firefox and Safari don't implement it (Firefox has declined to).
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
          // a failure of the backup itself — it was already generated and
          // verified server-side — just nothing was written to disk.
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
        // Fallback for Firefox/Safari/mobile — no completion signal exists
        // here at all, so the note is worded to not claim the save is
        // done, only that it was handed off to the browser's downloader.
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

      // The results modal is the durable, detailed surface for the
      // verification outcome — shown every time, not just when something
      // is wrong, so "everything checked out" is just as visible as a
      // discrepancy would be.
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
      // the forced redirect lands. The full identity-level report travels
      // here now, not just a summary string — LoginPage renders it with
      // the same BackupRestoreResultModal the Dashboard uses for backup,
      // and the same report is already persisted server-side in
      // activity_logs.details regardless of whether this notice survives.
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
                          onViewReport={setActivityReportView}
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

      {/* Durable backup results — shown every time a backup finishes, success
          or warning, so the verification outcome is never only visible for
          a few seconds. Restore's equivalent renders on LoginPage after the
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

      {/* Re-opened from Recent Activity's "VIEW REPORT" link — same modal,
          same report, just pulled from activity_logs.details instead of a
          just-finished operation. This is what makes the report durable:
          closing it here loses nothing since it was already persisted. */}
      <BackupRestoreResultModal
        open={!!activityReportView}
        onClose={() => setActivityReportView(null)}
        operation={activityReportView?.operation}
        report={activityReportView?.report}
        filename={activityReportView?.filename}
      />

      {/* Snackbar is now reserved for transient, non-verification issues
          (e.g. a local disk-save failure) — the verification outcome itself
          always goes through the modal above, not this. */}
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