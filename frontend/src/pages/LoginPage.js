import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Button, TextField, Typography, Paper, CircularProgress, Alert, Link, } from "@mui/material";
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
    return (_jsx(Box, { sx: {
            minHeight: "100vh",
            width: "100vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#111",
            pt: { xs: 10, md: 12 },
            pb: 6,
            boxSizing: "border-box",
        }, children: _jsxs(Paper, { elevation: 8, sx: {
                p: 5,
                minWidth: 350,
                maxWidth: 400,
                background: "#181818",
                borderRadius: 3,
                boxShadow: "0 4px 32px 0 rgba(244,67,54,0.10)",
            }, children: [_jsxs(Typography, { variant: "h4", align: "center", mb: 3, fontWeight: 900, sx: { color: "#fff", fontFamily: "Montserrat, sans-serif" }, children: ["Login to", " ", _jsx(Box, { component: "span", sx: { color: "#F44336" }, children: "EZREC" })] }), _jsxs("form", { onSubmit: handleLogin, style: { marginTop: 24 }, children: [_jsx(TextField, { label: "Email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), fullWidth: true, required: true, margin: "normal", InputLabelProps: { style: { color: "#fff", opacity: 0.8 } }, InputProps: { style: { color: "#fff" } }, sx: {
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: "#fff", opacity: 0.5 },
                                    "&:hover fieldset": { borderColor: "#F44336" },
                                    "&.Mui-focused fieldset": { borderColor: "#F44336" },
                                },
                                "& .MuiInputLabel-root": { color: "#fff", opacity: 0.8 },
                            } }), _jsx(TextField, { label: "Password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), fullWidth: true, required: true, margin: "normal", InputLabelProps: { style: { color: "#fff", opacity: 0.8 } }, InputProps: { style: { color: "#fff" } }, sx: {
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: "#fff", opacity: 0.5 },
                                    "&:hover fieldset": { borderColor: "#F44336" },
                                    "&.Mui-focused fieldset": { borderColor: "#F44336" },
                                },
                                "& .MuiInputLabel-root": { color: "#fff", opacity: 0.8 },
                            } }), error && (_jsx(Alert, { severity: "error", sx: { mt: 2 }, children: error })), _jsx(Button, { type: "submit", variant: "contained", fullWidth: true, sx: {
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
                            }, disabled: loading, children: loading ? (_jsx(CircularProgress, { size: 24, sx: { color: "#fff" } })) : ("Login") })] }), _jsx(Typography, { align: "center", mt: 3, children: _jsx(Link, { href: "#", underline: "hover", sx: {
                            color: "#fff",
                            opacity: 0.8,
                            fontWeight: 500,
                            fontFamily: "Montserrat, sans-serif",
                            cursor: "pointer",
                        }, onClick: () => alert("Password reset functionality coming soon!"), children: "Forgot Password?" }) })] }) }));
};
export default LoginPage;
