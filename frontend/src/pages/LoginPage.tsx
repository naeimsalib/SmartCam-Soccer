import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Link,
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
    if (error) {
      setError(error.message);
      return;
    }
    if (!data || !data.session || !data.user) {
      setError("Login failed: No session or user returned.");
      return;
    }
    setIsAuthenticated();
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
        background: "#111",
        pt: { xs: 10, md: 12 },
        pb: 6,
        boxSizing: "border-box",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 5,
          minWidth: 350,
          maxWidth: 400,
          background: "#181818",
          borderRadius: 3,
          boxShadow: "0 4px 32px 0 rgba(244,67,54,0.10)",
        }}
      >
        <Typography
          variant="h4"
          align="center"
          mb={3}
          fontWeight={900}
          sx={{ color: "#fff", fontFamily: "Montserrat, sans-serif" }}
        >
          Login to{" "}
          <Box component="span" sx={{ color: "#F44336" }}>
            EZREC
          </Box>
        </Typography>
        <form onSubmit={handleLogin} style={{ marginTop: 24 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            margin="normal"
            InputLabelProps={{ style: { color: "#fff", opacity: 0.8 } }}
            InputProps={{ style: { color: "#fff" } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#fff", opacity: 0.5 },
                "&:hover fieldset": { borderColor: "#F44336" },
                "&.Mui-focused fieldset": { borderColor: "#F44336" },
              },
              "& .MuiInputLabel-root": { color: "#fff", opacity: 0.8 },
            }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
            InputLabelProps={{ style: { color: "#fff", opacity: 0.8 } }}
            InputProps={{ style: { color: "#fff" } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#fff", opacity: 0.5 },
                "&:hover fieldset": { borderColor: "#F44336" },
                "&.Mui-focused fieldset": { borderColor: "#F44336" },
              },
              "& .MuiInputLabel-root": { color: "#fff", opacity: 0.8 },
            }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 3,
              py: 1.5,
              fontWeight: 700,
              fontSize: "1.1rem",
              background: "#F44336",
              color: "#fff",
              borderRadius: 2,
              fontFamily: "Montserrat, sans-serif",
              boxShadow: "none",
              "&:hover": { background: "#d32f2f", boxShadow: "none" },
            }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#fff" }} />
            ) : (
              "Login"
            )}
          </Button>
        </form>
        <Typography align="center" mt={3}>
          <Link
            href="#"
            underline="hover"
            sx={{
              color: "#fff",
              opacity: 0.8,
              fontWeight: 500,
              fontFamily: "Montserrat, sans-serif",
              cursor: "pointer",
            }}
            onClick={() => alert("Password reset functionality coming soon!")}
          >
            Forgot Password?
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage;
