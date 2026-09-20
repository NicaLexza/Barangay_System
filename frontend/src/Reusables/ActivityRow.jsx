import { useState } from "react";
import {
  Box,
  Typography,
  Divider,
  ListItem,
  ListItemText,
  Tooltip,
  Collapse,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const INK = "#0f1c2e";
const INK_2 = "#4a5568";
const INK_3 = "#94a3b8";
const BORDER = "#e2e8f0";
const SURFACE = "#f7f9fc";

const ACT_COLORS = {
  "Resident:added": "#2563eb",
  "Resident:updated": "#0369a1",
  "Resident:imported": "#2563eb",
  "Resident:archived": "#78716c",
  "Resident:restored": "#16a34a",
  "Household:added": "#16a34a",
  "Household:updated": "#15803d",
  "Account:created": "#7c3aed",
  "Eligibility Form:created": "#dc2626",
  "Eligibility Form:enabled": "#16a34a",
  "Eligibility Form:disabled": "#64748b",
  "Database:backup_created": "#0891b2",
  "Database:restored": "#0891b2",
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

export default ActivityRow;
