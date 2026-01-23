import { AppBar, Toolbar, Box, Button, Typography } from "@mui/material";
import {Link} from "react-router-dom";

const Navbar = () => {
  return (
    <AppBar position="fixed" elevation={1} sx={{ zIndex: 1300 }}>
      <Toolbar>

        {/* LEFT: Logo */}
        <Box display="flex" alignItems="center">
          <img
            src="/logo.png"
            alt="Barangay Logo"
            style={{ height: 40, marginRight: 8 }}
          />
        </Box>
        
        {/* CENTER: Navigation */}
        <Box
          display="flex" 
          gap={5} 
          flexShrink={0}
          mx="auto"
        >
          <Button color="inherit" component={Link} to="/Dashboard">Dashboard</Button>
          <Button color="inherit" component={Link} to="/Residents">Residents</Button>
          <Button color="inherit" component={Link} to="/Accounts">Accounts</Button>
          <Button color="inherit" component={Link} to="/Eligibility">Eligibility Forms</Button>
        </Box>

        {/* RIGHT: Logout */}
        <Box>
          <Button color="inherit">
            Logout
          </Button>
        </Box>

      </Toolbar>
    </AppBar>
  );
};

export default Navbar;