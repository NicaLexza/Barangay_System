import { useState } from "react";
import axios from "axios";
import { TextField, Button, Typography, Box, Grid, InputAdornment, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import LockIcon from '@mui/icons-material/Lock';

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
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
        navigate("/Accounts");
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
      <Grid 
        container 
        sx={{ 
          maxWidth: "900px",
          minHeight: "400px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        {/* Left side: Login Form */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            p: 4,
            backgroundColor: "white",
            borderRadius: "10px",
            borderRight: { md: ".5px solid #1e3f5a" },
            borderBottom: { xs: "3px solid #1e3f5a"},
            borderLeft: { xs: "3px solid #1e3f5a"},
            borderTop: { xs: "3px solid #1e3f5a"},
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
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setUsernameFocused(true)}
              onBlur={() => setUsernameFocused(false)}
              fullWidth
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "#f5f5f5",
                },
              }}
              InputLabelProps={{
                shrink: usernameFocused || username.length > 0,
                sx: {
                   "&:not(.MuiInputLabel-shrink)": {
                    marginLeft: "32px",
                  },
                  transition: "all 0.2s ease-in-out",
                  },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PermIdentityIcon sx={{ color: "#666" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Password */}
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              fullWidth
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "#f5f5f5",
                },
              }}
              InputLabelProps={{
                shrink: passwordFocused || password.length > 0,
                sx: {
                   "&:not(.MuiInputLabel-shrink)": {
                    marginLeft: "32px",
                  },
                  transition: "all 0.2s ease-in-out",
                  },
              }}
              slotProps={{
                input: {
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
                        sx={{ color: "#666" }}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
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
          md={6}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            backgroundColor: "#ffffff",
            minHeight: { xs: "300px", md: "auto" },
            borderRadius: "10px",
            borderLeft: { md: ".5px solid #1e3f5a" },
            borderRight: { md: "3px solid #1e3f5a" },
            borderBottom: { xs: "3px solid #1e3f5a"},
            borderTop: { xs: "3px solid #1e3f5a"},
          }}
        >
          <Box
            component="img"
            src="/blogo.jpg"
            alt="Barangay Logo"
            sx={{
              width: "100%",
              maxWidth: "280px",
              height: "auto",
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;