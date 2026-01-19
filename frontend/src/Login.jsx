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
        "http://localhost:5000/login",
        { username, password },
        { headers: { "Content-Type": "application/json" } }
      );

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("role", response.data.role); // will store the role in local storage
      
     if(role === "Admin"){
        navigate("/Dashboard");
     }
    } catch (error) {
      alert("Login failed");
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
        <Typography 
        variant="body2" 
        sx={{ mt: 2, color: "primary.main", textAlign: "center" }}
      >
        Don't have an account?{" "}
        <Link to="/" style={{ textDecoration: "none", color: "blue" }}>
          Register
        </Link>
      </Typography>
      </Box>
    </Container>
  );
};

export default Login;