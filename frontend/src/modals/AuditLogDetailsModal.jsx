// modals/AuditLogDetailsModal.jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import { getActionMeta, formatLogTime } from "../utils/AuditLogFormat.js";

const NAVY = "#002f59";
const INK = "#0f1c2e";
const INK_2 = "#4a5568";
const INK_3 = "#94a3b8";
const BORDER = "#e2e8f0";
const SURFACE = "#f7f9fc";

const SectionLabel = ({ children }) => (
  <Typography
    sx={{
      fontSize: "0.7rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: INK_3,
      mb: 1,
    }}
  >
    {children}
  </Typography>
);

const headCellSx = {
  fontSize: "0.7rem",
  fontWeight: 700,
  color: INK_3,
  py: 0.75,
  backgroundColor: SURFACE,
};

/** Field / Before / After table — shared by single-record and per-resident import diffs. */
const ChangesTable = ({ changes }) => (
  <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: "6px", overflow: "hidden" }}>
    <Table size="small" sx={{ "& td, & th": { borderColor: BORDER } }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ ...headCellSx, width: "30%" }}>Field</TableCell>
          <TableCell sx={{ ...headCellSx, width: "35%" }}>Before</TableCell>
          <TableCell sx={{ ...headCellSx, width: "35%" }}>After</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {changes.map((c, idx) => (
          <TableRow key={idx} sx={{ "&:last-child td": { borderBottom: 0 } }}>
            <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600, color: INK_2 }}>
              {c.field}
            </TableCell>
            <TableCell
              sx={{
                fontSize: "0.78rem",
                color: INK_3,
                textDecoration: c.from ? "line-through" : "none",
                fontStyle: c.from ? "normal" : "italic",
                wordBreak: "break-word",
              }}
            >
              {c.from || "(empty)"}
            </TableCell>
            <TableCell
              sx={{
                fontSize: "0.78rem",
                color: c.to ? INK : INK_3,
                fontWeight: c.to ? 500 : 400,
                fontStyle: c.to ? "normal" : "italic",
                wordBreak: "break-word",
              }}
            >
              {c.to || "(empty)"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
);

const ImportBody = ({ added, updated }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
    {added.length > 0 && (
      <Box>
        <SectionLabel>Added ({added.length})</SectionLabel>
        {added.map((r, idx) => (
          <Typography key={r.resident_id ?? idx} sx={{ fontSize: "0.82rem", color: INK, lineHeight: 1.7 }}>
            • {r.name}
            {r.head_name && (
              <Typography component="span" sx={{ fontSize: "0.76rem", color: INK_3 }}>
                {" "}(member of {r.head_name})
              </Typography>
            )}
          </Typography>
        ))}
      </Box>
    )}

    {updated.length > 0 && (
      <Box>
        <SectionLabel>Updated ({updated.length})</SectionLabel>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
          {updated.map((r, idx) => (
            <Box key={r.resident_id ?? idx}>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: INK, mb: 0.5 }}>
                {r.name}
              </Typography>
              {r.changes?.length > 0 ? (
                <ChangesTable changes={r.changes} />
              ) : (
                <Typography sx={{ fontSize: "0.76rem", color: INK_3, fontStyle: "italic" }}>
                  No field changes recorded
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    )}
  </Box>
);

/**
 * Details popup for audit log rows. Backup/restore rows do NOT use this —
 * they keep opening BackupRestoreResultModal exactly as before. This
 * handles everything else that has extra detail: field diffs, bulk
 * import breakdowns, and free-text details.
 *
 * Props:
 *   open    — boolean
 *   onClose — called when dismissed
 *   log     — the audit log row, with `_detail` attached by AuditLogsTable
 *             (from getLogDetail in utils/auditLogFormat.js)
 */
const AuditLogDetailsModal = ({ open, onClose, log }) => {
  if (!log) return null;

  const detail = log._detail;
  const action = getActionMeta(log.action_type);

  const metaRows = [
    [
      "Action",
      <Chip
        key="chip"
        size="small"
        label={action.label}
        sx={{ backgroundColor: action.bg, color: action.color, fontWeight: 600, fontSize: "0.72rem" }}
      />,
    ],
    ["Performed by", log.performed_by || "System"],
    ["Date & time", formatLogTime(log.action_time)],
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pt: 3, pb: 1.5, px: 3 }}>
        <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, color: NAVY }} noWrap>
          {log.entity_name || "Audit Log Details"}
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: INK_3 }}>
          {log.entity_type}
          {log.entity_id != null ? ` (ID ${log.entity_id})` : ""}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 1 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "110px 1fr",
            alignItems: "center",
            rowGap: 1,
            mb: 2,
          }}
        >
          {metaRows.map(([label, value]) => (
            <Box key={label} sx={{ display: "contents" }}>
              <Typography sx={{ fontSize: "0.78rem", color: INK_3 }}>{label}</Typography>
              <Box sx={{ fontSize: "0.82rem", color: INK, fontWeight: 500 }}>{value}</Box>
            </Box>
          ))}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {detail.type === "changes" && (
          <>
            <SectionLabel>Changes ({detail.data.length})</SectionLabel>
            <ChangesTable changes={detail.data} />
          </>
        )}

        {detail.type === "import" && (
          <ImportBody added={detail.data.added} updated={detail.data.updated} />
        )}

        {detail.type === "text" && (
          <Box
            sx={{
              p: 1.5,
              backgroundColor: SURFACE,
              border: `1px solid ${BORDER}`,
              borderRadius: "6px",
            }}
          >
            <Typography sx={{ fontSize: "0.82rem", color: INK_2, lineHeight: 1.6 }}>
              {detail.data}
            </Typography>
          </Box>
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

export default AuditLogDetailsModal;