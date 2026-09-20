// utils/auditLogFormat.js
//
// Shared by AuditLogsTable.jsx (columns + chips + the Action Type filter)
// and modals/AuditLogDetailsModal.jsx (popup body), so the label/color for
// an action and the interpretation of `changes` / `details` live in one
// place. Stored data is never modified — this only changes how it's shown.
import dayjs from "dayjs";

// ── Action labels + colors ─────────────────────────────────────────────
// Keyed by the raw action_type stored in activity_logs. Anything not
// listed here falls back to a humanized version of the raw value (see
// getActionMeta), so a new action type added later still renders sensibly.
const ACTION_META = {
  added:                  { label: "Added",                 color: "#2563eb", bg: "#eff6ff" },
  created:                { label: "Created",               color: "#2563eb", bg: "#eff6ff" },
  member_added:           { label: "Member Added",          color: "#2563eb", bg: "#eff6ff" },
  imported:               { label: "Imported",              color: "#4f46e5", bg: "#eef2ff" },
  updated:                { label: "Updated",               color: "#0369a1", bg: "#e0f2fe" },
  archived:               { label: "Archived",              color: "#78716c", bg: "#f5f5f4" },
  restored:               { label: "Restored",              color: "#16a34a", bg: "#f0fdf4" },
  deleted:                { label: "Deleted",               color: "#dc2626", bg: "#fef2f2" },
  enabled:                { label: "Enabled",               color: "#16a34a", bg: "#f0fdf4" },
  disabled:               { label: "Disabled",              color: "#64748b", bg: "#f1f5f9" },
  head_transferred:       { label: "Head Transferred",      color: "#7c3aed", bg: "#f5f3ff" },
  removed_from_household: { label: "Removed from Household", color: "#b45309", bg: "#fffbeb" },
  marked_received:        { label: "Marked Received",       color: "#16a34a", bg: "#f0fdf4" },
  reverted_to_pending:    { label: "Reverted to Pending",   color: "#b45309", bg: "#fffbeb" },
  backup_created:         { label: "Backup Created",        color: "#0891b2", bg: "#ecfeff" },
  "Password Reset":       { label: "Password Reset",        color: "#b45309", bg: "#fffbeb" },
  "Password Changed":     { label: "Password Changed",      color: "#7c3aed", bg: "#f5f3ff" },
};

const humanize = (raw) =>
  String(raw ?? "")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const getActionMeta = (actionType) =>
  ACTION_META[actionType] ?? {
    label: humanize(actionType) || "—",
    color: "#475569",
    bg: "#f1f5f9",
  };

// ── Dates ──────────────────────────────────────────────────────────────
export const formatLogTime = (value) =>
  value ? dayjs(value).format("MMM D, YYYY h:mm A") : "—";

// ── Parsing ────────────────────────────────────────────────────────────
// `changes` / `details` come back from MySQL as TEXT. logActivity always
// JSON.stringifies them, so a plain-string `details` (head transfers) is a
// JSON *string* literal — parsing it yields the bare string. If parsing
// fails, the raw text is returned as-is rather than dropped.
const safeParse = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/**
 * Classifies what a log row has to show in its Details column / popup.
 *
 * Returns { type, data, summary }:
 *   "report"  — Database backup/restore verification report (opens the
 *               existing BackupRestoreResultModal)
 *   "import"  — bulk resident import: { added: [...], updated: [...] }
 *   "changes" — single-record field diff: [{ field, from, to }]
 *   "text"    — free-text detail (e.g. head transfers)
 *   "none"    — nothing to show (column renders "—", no button)
 *
 * `summary` is the one-line teaser shown in the table cell so every row
 * stays the same height.
 */
export const getLogDetail = (log) => {
  const details = safeParse(log.details);
  const changes = safeParse(log.changes);

  if (
    log.entity_type === "Database" &&
    isPlainObject(details) &&
    details.expected &&
    details.actual
  ) {
    return {
      type: "report",
      data: details,
      summary: details.status === "warning" ? "Discrepancies found" : "Verified",
    };
  }

  if (isPlainObject(details) && (Array.isArray(details.added) || Array.isArray(details.updated))) {
    const added = details.added ?? [];
    const updated = details.updated ?? [];
    if (added.length + updated.length > 0) {
      const parts = [];
      if (added.length > 0) parts.push(`${added.length} added`);
      if (updated.length > 0) parts.push(`${updated.length} updated`);
      return { type: "import", data: { added, updated }, summary: parts.join(", ") };
    }
  }

  // Array.isArray guard matters: older backup/restore rows stored an object
  // in `changes`, which must not be treated as a field diff.
  if (Array.isArray(changes) && changes.length > 0) {
    return {
      type: "changes",
      data: changes,
      summary: `Changed: ${changes.map((c) => c.field).join(", ")}`,
    };
  }

  if (typeof details === "string" && details.trim()) {
    return { type: "text", data: details.trim(), summary: details.trim() };
  }

  return { type: "none", data: null, summary: "" };
};