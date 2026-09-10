// modals/BackupRestoreResultModal.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Divider,
  Collapse,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

const NAVY = "#002f59";

const TABLE_LABELS = {
  residents: "Residents",
  accounts: "Accounts",
  eligibility_forms: "Eligibility Forms",
  eligibility_entries: "Eligibility Entries",
};

const TABLE_ORDER = ["residents", "accounts", "eligibility_forms", "eligibility_entries"];

/** One table's row: expected/actual counts, plus an expandable list of
 * specifically named missing records when there's a discrepancy. */
const TableRow = ({ tableKey, expected, actual, missingRecords }) => {
  const [expanded, setExpanded] = useState(false);
  const hasIssue = (missingRecords?.length ?? 0) > 0;

  return (
    <Box sx={{ py: 1.25 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          {hasIssue ? (
            <WarningAmberIcon sx={{ fontSize: 18, color: "#b45309", flexShrink: 0 }} />
          ) : (
            <CheckCircleIcon sx={{ fontSize: 18, color: "#16a34a", flexShrink: 0 }} />
          )}
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#0f1c2e" }}>
            {TABLE_LABELS[tableKey] || tableKey}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
          <Typography
            sx={{ fontSize: "0.78rem", color: hasIssue ? "#b45309" : "#64748b", whiteSpace: "nowrap" }}
          >
            {actual} of {expected} verified
          </Typography>
          {hasIssue && (
            <Button
              size="small"
              onClick={() => setExpanded((v) => !v)}
              endIcon={expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              sx={{ textTransform: "none", fontSize: "0.75rem", color: "#b45309", minWidth: 0, px: 1 }}
            >
              {expanded ? "Hide" : "View"}
            </Button>
          )}
        </Box>
      </Box>

      {hasIssue && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              mt: 1,
              ml: 3.5,
              p: 1.25,
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "6px",
            }}
          >
            <Stack spacing={0.5}>
              {missingRecords.map((r) => (
                <Typography key={r.id} sx={{ fontSize: "0.75rem", color: "#78350f" }}>
                  • {r.name}{" "}
                  <Typography component="span" sx={{ fontSize: "0.7rem", color: "#a16207" }}>
                    (ID: {r.id})
                  </Typography>
                </Typography>
              ))}
            </Stack>
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

/**
 * Shared success/warning results dialog for both backup and restore
 * operations. Rendered every time either operation finishes — unlike a
 * snackbar, it doesn't disappear on its own. The same report is already
 * persisted to activity_logs.details by the backend before this dialog
 * ever opens, so dismissing it never loses the information — it can be
 * re-viewed later from Recent Activity.
 *
 * Props:
 *   open              — boolean
 *   onClose           — called when dismissed
 *   operation         — "backup" | "restore"
 *   report            — { status: "success"|"warning", expected: {...}, actual: {...}, missing: {...} }
 *   filename          — optional, the backup/restore file name for context
 *   saveNote          — optional, extra line about local file-save status (backup only)
 *   requestedSummary  — optional, one-line "what was asked for" context (backup only)
 */
const BackupRestoreResultModal = ({
  open,
  onClose,
  operation = "backup",
  report,
  filename,
  saveNote,
  requestedSummary,
}) => {
  if (!report) return null;

  const hasIssues = report.status === "warning";
  const opLabel = operation === "backup" ? "Backup" : "Restore";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pt: 3, pb: 1.5, px: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: hasIssues ? "#fef3c7" : "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {hasIssues ? (
              <WarningAmberIcon sx={{ color: "#b45309", fontSize: 22 }} />
            ) : (
              <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 22 }} />
            )}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, color: NAVY }}>
              {hasIssues ? `${opLabel} Completed with Discrepancies` : `${opLabel} Verified Successfully`}
            </Typography>
            {filename && (
              <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }} noWrap>
                {filename}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 1 }}>
        {requestedSummary && (
          <Typography sx={{ fontSize: "0.76rem", color: "#94a3b8", mb: 1 }}>
            Requested: {requestedSummary}
          </Typography>
        )}

        <Typography sx={{ fontSize: "0.82rem", color: "#4a5568", mb: 2 }}>
          {hasIssues
            ? `Some records could not be ${operation === "backup" ? "included in the backup file" : "restored to the database"}. Details are listed per table below, and this report is saved in Recent Activity for later reference.`
            : "Every record was checked individually against the database — nothing is missing."}
        </Typography>

        <Divider sx={{ mb: 1 }} />

        <Box>
          {TABLE_ORDER.map((key, idx) => (
            <React.Fragment key={key}>
              <TableRow
                tableKey={key}
                expected={report.expected?.[key] ?? 0}
                actual={report.actual?.[key] ?? 0}
                missingRecords={report.missing?.[key] ?? []}
              />
              {idx < TABLE_ORDER.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Box>

        {saveNote && (
          <>
            <Divider sx={{ mt: 1.5, mb: 1.5 }} />
            <Typography sx={{ fontSize: "0.76rem", color: "#64748b" }}>{saveNote}</Typography>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ textTransform: "none", backgroundColor: NAVY, "&:hover": { backgroundColor: "#001c38" } }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BackupRestoreResultModal;