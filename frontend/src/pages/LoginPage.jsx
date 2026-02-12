import { useState } from "react";
import axios from "axios";
import { TextField, Button, Typography, Box, Grid,InputAdornment, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from '@mui/icons-material/Visibility';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import LockIcon from '@mui/icons-material/Lock';



const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("Staff");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please fill in all the fields");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { username, password },
        { headers: { "Content-Type": "application/json" } }
      );

      // save token and info from backend
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("role", response.data.role);

    // navigate based on backend role
    if (response.data.role === "Admin") {
      navigate("/Dashboard");
    } else if (response.data.role === "Staff") {
      navigate("/Accounts"); // replace with your staff dashboard route
    }

  } catch (error) {
    alert(error.response?.data?.message || "Login failed");
  }
};


  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
        overflow: "hidden",
          
      }}
    >
      <Grid container spacing={0} sx={{ height: "350px", width: "700px" }}>
        {/* Left side: Login Form */}
        <Grid
          item
          xs={12}
          sm={6}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            p: 4,
            backgroundColor: "white",
            borderTopLeftRadius: "16px",
            borderBottomLeftRadius: "16px",
            border: "3px solid #1e3f5a",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              textAlign: "center",
              mb: 4,
              fontWeight: "bold",
              color: "#1976d2",
            }}
          >
            Login
          </Typography>

          <Box sx={{ display: "flex", gap: 1.5, flexDirection: "column" }}>
            {/* Username */}
            <TextField
              placeholder="Username"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "#f5f5f5",
                },
                "& .MuiOutlinedInput-input::label": {
                  opacity: 0.7,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PermIdentityIcon sx={{ color: "#666" }} />
                  </InputAdornment>
                ),
              }}
            />
          


            {/* Password */}
            <TextField
              placeholder="Password"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "#f5f5f5",
                },
                "& .MuiOutlinedInput-input::label": {
                  opacity: 0.7,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "#666" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "#000" }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            </Box>
            
          {/* Login Button */}
          <Button
            variant="contained"
            onClick={handleLogin}
            sx={{
              mt: 3,
              py: 1.5,
              backgroundColor: "#2d5a8c",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              borderRadius: "8px",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#1e3f5a",
              },
            }}
          >
            Login
          </Button>
        </Grid>

        {/* Right side: Logo Area */}
        <Grid
          item
          xs={12}
          sm={6}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            backgroundColor: "#ffffff",
            borderTopRightRadius: "16px",
            borderBottomRightRadius: "16px",
            border: "3px solid #1e3f5a",
            borderLeft: "none",
            minHeight: { xs: "300px", sm: "auto" },
          }}
        >
          <Box
            component="img"
            src="/blogo.jpg"
            alt="Barangay Logo"
            sx={{
              width: { xs: "200px", sm: "280px" },
              height: "auto",
              maxWidth: "100%",
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;