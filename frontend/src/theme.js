// src/theme.js
import { createTheme } from "@mui/material/styles";

// Minimal, intentional theme — only the three overrides that give the most
// coverage for the least risk. See PROJECT_CONTEXT.md design audit notes
// for the full rationale. This does NOT touch typography/fonts; Login and
// ChangePassword keep their own explicit fontWeight/textAlign combos.
const theme = createTheme({
  palette: {
    primary: {
      main: "#002f59",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
  },
});

export default theme;