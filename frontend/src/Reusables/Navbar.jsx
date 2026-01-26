import { AppBar, Toolbar, Box, Button } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation(); // to know which page is active
  const mainColor = "#002f59be";

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
            src="/logo.png"
            alt="Barangay Logo"
            style={{
              height: 40,
              width: 40,
              objectFit: "contain",
              marginRight: 8,
            }}
          />
        </Box>
        
        {/* CENTER: Navigation */}
        <Box display="flex" gap={5} flexShrink={0} mx="auto">
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
                  color: isActive ? "#fff" : mainColor, // text color
                  border: `1px solid ${mainColor}`,
                  backgroundColor: isActive ? mainColor : "transparent",
                  borderRadius: 1,
                  textTransform: "none",
                  textDecoration: "none",
                  "&:hover": {
                    backgroundColor: isActive ? mainColor : `${mainColor}33`,
                    color: isActive ? "#fff" : mainColor, // maintain color on hover
                  },
                  "&:active": {
                    color: isActive ? "#fff" : mainColor, // maintain color when clicked
                  },
                  "&:visited": {
                    color: isActive ? "#fff" : mainColor, // maintain color for visited links
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        {/* RIGHT: Logout */}
        <Box>
          <Button
            sx={{
              color: mainColor,
              border: `1px solid ${mainColor}`,
              borderRadius: 1,
              textTransform: "none",
              backgroundColor: "transparent",
              "&:hover": { backgroundColor: `${mainColor}33` },
            }}
          >
            Logout
          </Button>
        </Box>

      </Toolbar>
    </AppBar>
  );
};

export default Navbar;