// Reusables/ModalLogoBadge.jsx
import { Box } from "@mui/material";

/**
 * Small, fixed-size brand mark for the bottom-left of a modal's
 * DialogActions row, opposite the action buttons.
 *
 * Deliberately lives in DialogActions (fixed height, never scrolls)
 * rather than as a background image behind DialogContent (which grows
 * with form length and can scroll) — that's what guarantees this can
 * never get cropped, unlike the old full-bleed watermark approach.
 */
const ModalLogoBadge = () => (
  <Box
    component="img"
    src="/BLOGO.png"
    alt="Barangay Logo"
    sx={{ height: 28, width: "auto", opacity: 0.55, flexShrink: 0 }}
  />
);

export default ModalLogoBadge;