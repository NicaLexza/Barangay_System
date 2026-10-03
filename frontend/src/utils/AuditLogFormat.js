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
const GREEN = { color: "#16a34a", bg: "#f0fdf4" }; // create / positive
const BLUE  = { color: "#2563eb", bg: "#eff6ff" }; // modify
const RED   = { color: "#dc2626", bg: "#fef2f2" }; // destructive
const AMBER = { color: "#b45309", bg: "#fffbeb" }; // reversal / hold
const TEAL  = { color: "#0891b2", bg: "#ecfeff" }; // system

const ACTION_META = {
  // Green — create / positive
  added:                  { label: "Added",                  ...GREEN },
  created:                { label: "Created",                ...GREEN },
  member_added:           { label: "Member Added",           ...GREEN },
  imported:               { label: "Imported",               ...GREEN },
  restored:               { label: "Restored",               ...GREEN },
  enabled:                { label: "Enabled",                ...GREEN },
  marked_received:        { label: "Marked Received",        ...GREEN },
  promoted_from_waitlist: { label: "Promoted from Waitlist", ...GREEN },

  // Blue — modify
  updated:                { label: "Updated",                ...BLUE },
  head_transferred:       { label: "Head Transferred",       ...BLUE },
  "Password Changed":     { label: "Password Changed",       ...BLUE },
  "Password Reset":       { label: "Password Reset",         ...BLUE },
  override_promoted:      { label: "Override Promoted",      ...BLUE },

  // Red — destructive
  deleted:                { label: "Deleted",                ...RED },
  removed:                { label: "Removed",                ...RED },
  override_removed:       { label: "Override Removed",       ...RED },

  // Amber — reversal / hold
  archived:               { label: "Archived",               ...AMBER },
  disabled:               { label: "Disabled",               ...AMBER },
  reverted_to_pending:    { label: "Reverted to Pending",    ...AMBER },
  removed_from_household: { label: "Removed from Household", ...AMBER },

  // Teal — system
  backup_created:         { label: "Backup Created",         ...TEAL },
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
 * Returns { type, data, summary, requestedBy? }:
 *   "report"  — Database backup/restore verification report (opens the
 *               existing BackupRestoreResultModal)
 *   "import"  — bulk resident import: { added: [...], updated: [...] }
 *   "changes" — single-record field diff: [{ field, from, to }]
 *   "request" — an action a Staff member requested and an Admin authorized,
 *               with no other detail to show (details = { requested_by })
 *   "text"    — free-text detail (e.g. head transfers)
 *   "none"    — nothing to show (column renders "—", no button)
 *
 * `requestedBy` (staff username) is attached to "changes" and "request"
 * results when `details.requested_by` is present, so the popup can show who
 * asked for the action.
 *
 * `summary` is the one-line teaser shown in the table cell so every row
 * stays the same height.
 */
export const getLogDetail = (log) => {
  const details = safeParse(log.details);
  const changes = safeParse(log.changes);

  const requestedBy =
    isPlainObject(details) && typeof details.requested_by === "string" && details.requested_by.trim()
      ? details.requested_by.trim()
      : null;

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
    const result = {
      type: "changes",
      data: changes,
      summary: `Changed: ${changes.map((c) => c.field).join(", ")}`,
    };
    return requestedBy ? { ...result, requestedBy } : result;
  }

  // Eligibility entry actions — remove-with-reason, auto-promotion,
  // override-remove, and override-promote. The details object shape varies
  // slightly between normal and override actions, so we use action_type to
  // pick the right summary text.
  if (
    log.entity_type === "Eligibility Entry" &&
    isPlainObject(details) &&
    (details.reason || details.replaced_entry_id != null || details.replaced_by_entry_id != null)
  ) {
    let summary;
    const at = log.action_type;
    if (at === "override_removed") {
      summary = `Override removed — replaced by ${details.replaced_by_resident || "promoted entry"}`;
    } else if (at === "override_promoted") {
      summary = `Override promoted (rank #${details.rank_no ?? "?"}) — replaced ${details.replaced_resident || "removed entry"}`;
    } else if (at === "promoted_from_waitlist") {
      summary = `Promoted (rank #${details.rank_no ?? "?"}) — replaced ${details.replaced_resident || "removed entry"}`;
    } else {
      // Normal "removed" action
      summary = details.promoted_resident
        ? `Removed — ${details.promoted_resident} promoted`
        : "Removed (no promotion)";
    }
    return { type: "eligibility_entry", data: details, summary };
  }

  if (typeof details === "string" && details.trim()) {
    return { type: "text", data: details.trim(), summary: details.trim() };
  }

  // Staff-requested action with nothing else to show (e.g. Enable, Disable,
  // Archive). Without this branch the row would render "—" and the
  // requester would be invisible.
  if (requestedBy) {
    return { type: "request", data: null, summary: `Requested by ${requestedBy}`, requestedBy };
  }

  return { type: "none", data: null, summary: "" };
};