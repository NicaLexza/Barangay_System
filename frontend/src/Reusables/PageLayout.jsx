// components/Reusables/PageLayout.jsx
import { Box } from "@mui/material";

const NAVBAR_HEIGHT = 64;
const FOOTER_HEIGHT = 75;

const PageLayout = ({ children }) => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: NAVBAR_HEIGHT,
        left: 0,
        right: 0,
        bottom: FOOTER_HEIGHT,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </Box>
  );
};

export default PageLayout;