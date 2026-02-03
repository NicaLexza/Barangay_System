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
     <Typography
  variant="body2"
  sx={{ color: "#fff", textAlign: "center" }}
>
  Resident Profiling and Management System v1.0.0
  <br />
  Barangay 214, Zone 20, District II, City of Manila
  <br />
  © 2025 – For Official Use by Authorized Barangay Personnel Only
</Typography>

    </Box>
  );
};

export default Footer;
