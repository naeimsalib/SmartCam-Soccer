import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Typography, TextField, Button, Alert } from "@mui/material";
const ContactPage = () => {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [submitted, setSubmitted] = useState(false);
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
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
        }, children: _jsxs(Box, { sx: { textAlign: "center", px: 2, width: "100%", maxWidth: 500 }, children: [_jsx(Typography, { variant: "h3", fontWeight: 900, sx: { color: "#fff", mb: 3, fontFamily: "Montserrat, sans-serif" }, children: "Contact Us" }), _jsx(Typography, { variant: "body1", sx: { color: "#fff", opacity: 0.8, mb: 4, fontSize: "1.2rem" }, children: "Have a question or want to get started? Fill out the form below and our team will get back to you soon." }), submitted && (_jsx(Alert, { severity: "success", sx: { mb: 3 }, children: "Thank you! Your message has been sent." })), _jsxs(Box, { component: "form", onSubmit: handleSubmit, sx: { display: "flex", flexDirection: "column", gap: 3 }, children: [_jsx(TextField, { label: "Name", name: "name", value: form.name, onChange: handleChange, required: true, fullWidth: true, InputLabelProps: { style: { color: "#fff", opacity: 0.8 } }, InputProps: { style: { color: "#fff" } }, sx: {
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: "#fff", opacity: 0.5 },
                                    "&:hover fieldset": { borderColor: "#F44336" },
                                    "&.Mui-focused fieldset": { borderColor: "#F44336" },
                                },
                                "& .MuiInputLabel-root": { color: "#fff", opacity: 0.8 },
                            } }), _jsx(TextField, { label: "Email", name: "email", type: "email", value: form.email, onChange: handleChange, required: true, fullWidth: true, InputLabelProps: { style: { color: "#fff", opacity: 0.8 } }, InputProps: { style: { color: "#fff" } }, sx: {
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: "#fff", opacity: 0.5 },
                                    "&:hover fieldset": { borderColor: "#F44336" },
                                    "&.Mui-focused fieldset": { borderColor: "#F44336" },
                                },
                                "& .MuiInputLabel-root": { color: "#fff", opacity: 0.8 },
                            } }), _jsx(TextField, { label: "Message", name: "message", value: form.message, onChange: handleChange, required: true, fullWidth: true, multiline: true, minRows: 4, InputLabelProps: { style: { color: "#fff", opacity: 0.8 } }, InputProps: { style: { color: "#fff" } }, sx: {
                                "& .MuiOutlinedInput-root": {
                                    "& fieldset": { borderColor: "#fff", opacity: 0.5 },
                                    "&:hover fieldset": { borderColor: "#F44336" },
                                    "&.Mui-focused fieldset": { borderColor: "#F44336" },
                                },
                                "& .MuiInputLabel-root": { color: "#fff", opacity: 0.8 },
                            } }), _jsx(Button, { type: "submit", variant: "contained", sx: {
                                background: "#F44336",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "1.1rem",
                                px: 4,
                                py: 1.5,
                                borderRadius: 2,
                                fontFamily: "Montserrat, sans-serif",
                                boxShadow: "none",
                                "&:hover": { background: "#d32f2f", boxShadow: "none" },
                            }, children: "Send Message" })] })] }) }));
};
export default ContactPage;
