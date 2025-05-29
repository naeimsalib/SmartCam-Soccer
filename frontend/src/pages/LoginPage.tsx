import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const LoginPage = ({
  setIsAuthenticated,
}: {
  setIsAuthenticated: () => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    console.log("Supabase login response:", { data, error });

    if (error) {
      setError(error.message);
      return;
    }

    if (!data || !data.session || !data.user) {
      setError("Login failed: No session or user returned.");
      console.log("Login failed: No session or user returned.", { data });
      return;
    }

    setIsAuthenticated();
    console.log("Redirecting to dashboard...");
    navigate("/dashboard");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
        pt: { xs: "96px", md: "104px" },
      }}
    >
      <Paper elevation={6} sx={{ p: 5, minWidth: 350, maxWidth: 400 }}>
        <Typography
          variant="h5"
          align="center"
          mb={3}
          fontWeight={600}
          color="primary"
        >
          Login to SmartCam Soccer
        </Typography>
        <form onSubmit={handleLogin}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, py: 1.5, fontWeight: 600 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "LOGIN"}
          </Button>
        </form>
        <Typography align="center" mt={2} color="primary">
          Forgot Password?
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage;
