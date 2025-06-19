import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Button, TextField, Typography, Paper, Alert, Container, } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await signIn(email, password);
            navigate("/dashboard");
        }
        catch (err) {
            setError("Failed to sign in. Please check your credentials.");
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx(Container, { maxWidth: "sm", sx: { mt: 8 }, children: _jsxs(Paper, { elevation: 3, sx: {
                p: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(10px)",
                borderRadius: 2,
            }, children: [_jsx(Typography, { component: "h1", variant: "h4", sx: { color: "#fff", mb: 3, fontWeight: 600 }, children: "Sign In" }), error && (_jsx(Alert, { severity: "error", sx: { width: "100%", mb: 2 }, children: error })), _jsxs(Box, { component: "form", onSubmit: handleSubmit, sx: { width: "100%" }, children: [_jsx(TextField, { margin: "normal", required: true, fullWidth: true, id: "email", label: "Email Address", name: "email", autoComplete: "email", autoFocus: true, value: email, onChange: (e) => setEmail(e.target.value), sx: {
                                "& .MuiOutlinedInput-root": {
                                    color: "#fff",
                                    "& fieldset": {
                                        borderColor: "rgba(255, 255, 255, 0.23)",
                                    },
                                    "&:hover fieldset": {
                                        borderColor: "rgba(255, 255, 255, 0.5)",
                                    },
                                },
                                "& .MuiInputLabel-root": {
                                    color: "rgba(255, 255, 255, 0.7)",
                                },
                            } }), _jsx(TextField, { margin: "normal", required: true, fullWidth: true, name: "password", label: "Password", type: "password", id: "password", autoComplete: "current-password", value: password, onChange: (e) => setPassword(e.target.value), sx: {
                                "& .MuiOutlinedInput-root": {
                                    color: "#fff",
                                    "& fieldset": {
                                        borderColor: "rgba(255, 255, 255, 0.23)",
                                    },
                                    "&:hover fieldset": {
                                        borderColor: "rgba(255, 255, 255, 0.5)",
                                    },
                                },
                                "& .MuiInputLabel-root": {
                                    color: "rgba(255, 255, 255, 0.7)",
                                },
                            } }), _jsx(Button, { type: "submit", fullWidth: true, variant: "contained", disabled: loading, sx: {
                                mt: 3,
                                mb: 2,
                                py: 1.5,
                                fontWeight: 600,
                                fontSize: 18,
                                background: "#F44336",
                                "&:hover": {
                                    background: "#d32f2f",
                                },
                            }, children: loading ? "Signing in..." : "Sign In" })] })] }) }));
};
export default LoginPage;
