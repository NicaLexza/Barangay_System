import { useState } from "react";
import { AppBar, Toolbar, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";

const Navbar = () => {
  const location = useLocation(); // to know which page is active
  const mainColor = "#002f59be";
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <AppBar
      position="fixed"
      elevation={1}
      sx={{
        backgroundColor: "transparent", // remove default blue background
        borderBottom: `2px solid ${mainColor}`,
        zIndex: 1300,
      }}
    >
      <Toolbar>

        {/* LEFT: Logo */}
        <Box display="flex" alignItems="center">
          <img
            src="/blogo.jpg"
            alt="Barangay Logo"
            style={{
              height: 60,
              width: 70,
              objectFit: "contain",
              marginRight: 8,
              padding: 1.5,
            }}
          />
        </Box>
        
        {/* CENTER: Navigation */}
<Box
  display="flex"
  gap={3}
  mx="auto"
  sx={{
    width: "600px", // control total width of nav area
  }}
>
  {[
    { label: "Dashboard", path: "/Dashboard" },
    { label: "Residents", path: "/Residents" },
    { label: "Accounts", path: "/Accounts" },
    { label: "Eligibility Forms", path: "/Eligibility" },
  ].map((item) => {
    const isActive = location.pathname === item.path;

    return (
      <Button
        key={item.path}
        component={Link}
        to={item.path}
        sx={{
          flex: 1, //  makes all buttons equal width
          height: 48,
          color: isActive ? "#fff" : mainColor,
          border: `2px solid ${mainColor}`,
          backgroundColor: isActive ? mainColor : "transparent",
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 500,
          transition: "all 0.3s ease",

          "&:hover": {
            backgroundColor: isActive ? mainColor : `${mainColor}22`,
            color: '#000000',
            transform: "translateY(-3px)",
            boxShadow: `0 6px 12px ${mainColor}33`,
          },
        }}
      >
        {item.label}
      </Button>
    );
  })}
</Box>

        {/* LEFT: Logout */}
        <Box>
          <Button
            onClick={() => setOpen(true)}
            sx={{
              color: mainColor,
              border: `1px solid ${mainColor}`,
              borderRadius: 1,
              textTransform: "none",
              backgroundColor: "#F26076",
              "&:hover": { backgroundColor: `${mainColor}33` },
            }}
          >
            Logout
          </Button>

          <Dialog
  open={open}
  onClose={() => setOpen(false)}
  PaperProps={{
    sx: {
      borderRadius: 3,
      padding: 3,
      textAlign: "center",
      width: 360,
    },
  }}
>
  {/* Icon */}
  <Box
    sx={{
      width: 64,
      height: 64,
      borderRadius: "50%",
      backgroundColor: "#e3edf6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      mx: "auto",
      mb: 2,
    }}
  >
    <LogoutIcon sx={{ fontSize: 32, color: "#002f59be" }} />
  </Box>

  {/* Title */}
  <Typography variant="h6" fontWeight={600} mb={1}>
    Logout
  </Typography>

  {/* Message */}
  <Typography variant="body2" color="text.secondary" mb={3}>
    Are you sure you want to logout?
  </Typography>

  <Box display="flex" justifyContent="center" gap={2}>
  {/* ACTIONS */}
  <Button
    variant="contained"
    sx={{
      width: 110,
      textTransform: "none",
      borderRadius: 2,
      backgroundColor: "#4b6e8d",
      "&:hover": {
        backgroundColor: "#3f5f7a",
      },
    }}
    onClick={() => {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      setOpen(false);
      navigate("/");
    }}
  >
    Logout
  </Button>


  <Button
    variant="outlined"
    onClick={() => setOpen(false)}
    sx={{
      width: 110,
      textTransform: "none",
      borderRadius: 2,
    }}
  >
    Cancel
  </Button>
</Box>
</Dialog>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;