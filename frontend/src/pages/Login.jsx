import { useState } from "react";
import axios from "axios";
import { TextField, Button, Container, Typography, Box, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
  if (!username || !password) {
    alert("Please fill in all the fields");
    return;
  }

  try {
    const response = await axios.post(
      "http://localhost:5000/api/auth/login", // updated route
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
      navigate("/StaffPage"); // replace with your staff dashboard route
    }

  } catch (error) {
    alert(error.response?.data?.message || "Login failed");
  }
};


  return (
    <Container maxWidth="xs">
      <Box 
        sx={{ 
          textAlign: "center", 
          p: 3, 
          borderRadius: 2, 
          boxShadow: 3, 
          backgroundColor: "#f9f9f9" 
        }}
      >
        <Typography variant="h4" sx={{ color: "#333", mb: 2 }}>
          Login
        </Typography>
        <TextField
          label="Username"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          variant="outlined"
          sx={{ backgroundColor: "white" }}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          variant="outlined"
          sx={{ backgroundColor: "white" }}
        />
        <FormControl fullWidth margin="normal" sx={{ backgroundColor: "white" }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            label="Role"
          >
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Staff">Staff</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleLogin}
          sx={{ mt: 2, borderRadius: "8px", textTransform: "none" }}
        >
          Login
        </Button>
      </Box>
    </Container>
  );
};

export default Login;