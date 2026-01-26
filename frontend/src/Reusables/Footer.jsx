// components/Reusables/Footer.jsx
import { Box, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        height: "75px",
        backgroundColor: "#002f59be",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderTop: "1px solid #ddd",
        zIndex: 1000,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        © 2026 Your System Name. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
