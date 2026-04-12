// ChangePasswordPage.jsx
import { useState } from "react";
import axios from "axios";
import {
  TextField, Button, Typography, Box, Grid,
  InputAdornment, IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';

const ChangePasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      await axios.put(
        "http://localhost:5000/api/auth/change-default-password",
        { password, confirmPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // navigate to the correct page after password change
      const role = localStorage.getItem("role");
      if (role === "Admin") {
        navigate("/Dashboard");
      } else {
        navigate("/Accounts");
      }

    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
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
        {/* Left side — Form */}
        <Grid
          item xs={12} md={6}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            p: 4,
            backgroundColor: "white",
            borderRadius: "10px",
            borderRight: { md: ".5px solid #1e3f5a" },
            borderBottom: { xs: "3px solid #1e3f5a" },
            borderLeft: { xs: "3px solid #1e3f5a" },
            borderTop: { xs: "3px solid #1e3f5a" },
          }}
        >
          <Typography
            variant="h4"
            sx={{ textAlign: "center", mb: 1, fontWeight: "bold", color: "#1976d2" }}
          >
            Change Password
          </Typography>
          <Typography
            variant="body2"
            sx={{ textAlign: "center", mb: 3, color: "#666" }}
          >
            Your account requires a password change before continuing.
          </Typography>

          <Box sx={{ display: "flex", gap: 1.5, flexDirection: "column" }}>
            <TextField
              label="New Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              fullWidth
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", backgroundColor: "#f5f5f5" } }}
              InputLabelProps={{
                shrink: passwordFocused || password.length > 0,
                sx: {
                  "&:not(.MuiInputLabel-shrink)": { marginLeft: "32px" },
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
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: "#666" }}>
                        {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Confirm Password"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              fullWidth
              variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", backgroundColor: "#f5f5f5" } }}
              InputLabelProps={{
                shrink: confirmFocused || confirmPassword.length > 0,
                sx: {
                  "&:not(.MuiInputLabel-shrink)": { marginLeft: "32px" },
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
                      <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" sx={{ color: "#666" }}>
                        {showConfirm ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          {error && (
            <Typography color="error" sx={{ mt: 2, textAlign: "center", fontSize: "0.875rem" }}>
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              mt: 3, py: 1.5,
              backgroundColor: "#2d5a8c",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              borderRadius: "8px",
              textTransform: "none",
              "&:hover": { backgroundColor: "#1e3f5a" },
            }}
          >
            {loading ? "Saving..." : "Set New Password"}
          </Button>
        </Grid>

        {/* Right side — Logo */}
        <Grid
          item xs={12} md={6}
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
            borderBottom: { xs: "3px solid #1e3f5a" },
            borderTop: { xs: "3px solid #1e3f5a" },
          }}
        >
          <Box
            component="img"
            src="/BLOGO.png"
            alt="Barangay Logo"
            sx={{ width: "100%", maxWidth: "280px", height: "auto" }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChangePasswordPage;