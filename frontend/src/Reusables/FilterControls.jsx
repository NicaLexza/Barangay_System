// Reusables/FilterControls.jsx
//
// Shared building blocks for every "Quick Filters" popover (Residents,
// Accounts, Eligibility Entries) so they share one width, one section-header
// style, and one compact control look.
//
//  - FilterSection : uppercase mini-label + its control
//  - FilterToggle  : compact segmented control for SINGLE-choice fields
//  - FilterChips   : small selectable chips for MULTI-choice fields
import { Box, Typography, ToggleButton, ToggleButtonGroup, Chip } from "@mui/material";

const NAVY = "#002f59";
const NAVY_HOVER = "#001c38";

export const FILTER_POPOVER_WIDTH = 340;

export const filterPopoverPaperSx = {
  width: FILTER_POPOVER_WIDTH,
  p: 2,
  boxShadow: 3,
  maxHeight: "80vh",
  overflowY: "auto",
};

export const FilterSection = ({ label, children }) => (
  <Box>
    <Typography
      sx={{
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "#64748b",
        mb: 0.75,
      }}
    >
      {label}
    </Typography>
    {children}
  </Box>
);

/**
 * options: [{ value, label }]. A selection is always kept (clicking the
 * active button does nothing), so "All" is just another option.
 */
export const FilterToggle = ({ value, onChange, options }) => (
  <ToggleButtonGroup
    value={value}
    exclusive
    size="small"
    onChange={(e, next) => {
      if (next !== null) onChange(next);
    }}
    sx={{
      "& .MuiToggleButton-root": {
        py: 0.25,
        px: 1.25,
        fontSize: "0.75rem",
        lineHeight: 1.6,
        fontWeight: 500,
        textTransform: "none",
        "&.Mui-selected": {
          backgroundColor: NAVY,
          color: "#fff",
          "&:hover": { backgroundColor: NAVY_HOVER },
        },
      },
    }}
  >
    {options.map((o) => (
      <ToggleButton key={o.value} value={o.value}>
        {o.label}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
);

/**
 * selected: array of values currently on. onToggle(value) flips one.
 * options: [{ value, label }]
 */
export const FilterChips = ({ selected, onToggle, options }) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
    {options.map((o) => {
      const on = selected.includes(o.value);
      return (
        <Chip
          key={o.value}
          label={o.label}
          size="small"
          clickable
          onClick={() => onToggle(o.value)}
          variant={on ? "filled" : "outlined"}
          sx={{
            fontSize: "0.72rem",
            fontWeight: 500,
            borderColor: on ? NAVY : "#cbd5e1",
            backgroundColor: on ? NAVY : "transparent",
            color: on ? "#fff" : "#475569",
            "&:hover": { backgroundColor: on ? NAVY_HOVER : "#f1f5f9" },
          }}
        />
      );
    })}
  </Box>
);