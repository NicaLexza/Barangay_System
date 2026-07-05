// Reusables/InfoPopper.jsx
import { Popper, Paper, Typography } from "@mui/material";

/**
 * Shared hover-info popper used by the "Info" icon button on DataGrid rows
 * (Residents, Accounts, Eligibility Entries).
 *
 * Portal-based (not disablePortal) with a high z-index so it always renders
 * above DataGrid's own internal scroll/virtualization clipping, and above
 * the fixed Navbar (zIndex 1300) — this is the one positioning strategy
 * that's already proven not to get clipped near the edges of a scrolled grid.
 *
 * fields: array of { label, value } pairs, rendered in order as
 * "label: value" — falls back to "N/A" when value is null/undefined.
 */
const InfoPopper = ({ open, anchorEl, fields = [] }) => {
  return (
    <Popper open={open} anchorEl={anchorEl} placement="left-start" sx={{ zIndex: 9999 }}>
      <Paper elevation={3} sx={{ p: 1, maxWidth: 220 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>
          INFO
        </Typography>
        {fields.map(({ label, value }) => (
          <Typography variant="body2" key={label}>
            {label}: {value ?? "N/A"}
          </Typography>
        ))}
      </Paper>
    </Popper>
  );
};

export default InfoPopper;