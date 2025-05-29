import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Button, TextField, Typography, Paper, CircularProgress, Alert, } from "@mui/material";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
const LoginPage = ({ setIsAuthenticated, }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const handleLogin = async (e) => {
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
    return (_jsx(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)",
            pt: { xs: "96px", md: "104px" },
        }, children: _jsxs(Paper, { elevation: 6, sx: { p: 5, minWidth: 350, maxWidth: 400 }, children: [_jsx(Typography, { variant: "h5", align: "center", mb: 3, fontWeight: 600, color: "primary", children: "Login to SmartCam Soccer" }), _jsxs("form", { onSubmit: handleLogin, children: [_jsx(TextField, { label: "Email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), fullWidth: true, required: true, margin: "normal" }), _jsx(TextField, { label: "Password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), fullWidth: true, required: true, margin: "normal" }), error && (_jsx(Alert, { severity: "error", sx: { mt: 2 }, children: error })), _jsx(Button, { type: "submit", variant: "contained", color: "primary", fullWidth: true, sx: { mt: 2, py: 1.5, fontWeight: 600 }, disabled: loading, children: loading ? _jsx(CircularProgress, { size: 24 }) : "LOGIN" })] }), _jsx(Typography, { align: "center", mt: 2, color: "primary", children: "Forgot Password?" })] }) }));
};
export default LoginPage;
