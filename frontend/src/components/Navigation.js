import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AppBar, Toolbar, Button, Box, Typography } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
const navLinks = [
    { label: "Features", to: "/features" },
    { label: "Pricing", to: "/pricing" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
];
const Navigation = () => {
    const location = useLocation();
    return (_jsx(AppBar, { position: "static", sx: { background: "#111", boxShadow: "none", py: 1 }, children: _jsxs(Toolbar, { sx: { justifyContent: "space-between", minHeight: 80 }, children: [_jsx(Box, { sx: { display: "flex", alignItems: "center" }, children: _jsxs(Typography, { variant: "h4", component: Link, to: "/", sx: {
                            fontWeight: 900,
                            letterSpacing: 1,
                            color: "#fff",
                            textDecoration: "none",
                            fontFamily: "Montserrat, sans-serif",
                            mr: 4,
                            display: "flex",
                            alignItems: "center",
                        }, children: [_jsx(Box, { component: "span", sx: { color: "#fff" }, children: "EZ" }), _jsx(Box, { component: "span", sx: { color: "#F44336", ml: 0.5 }, children: "REC" })] }) }), _jsx(Box, { sx: { display: "flex", gap: 3, flex: 1, justifyContent: "center" }, children: navLinks.map((link) => (_jsx(Button, { component: Link, to: link.to, sx: {
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: "1.1rem",
                            letterSpacing: 1,
                            borderBottom: location.pathname === link.to
                                ? "2px solid #F44336"
                                : "2px solid transparent",
                            borderRadius: 0,
                            background: "none",
                            px: 2,
                            py: 1,
                            textTransform: "none",
                            fontFamily: "Montserrat, sans-serif",
                            transition: "border-bottom 0.2s",
                            "&:hover": {
                                borderBottom: "2px solid #F44336",
                                background: "none",
                            },
                        }, children: link.label }, link.to))) }), _jsx(Button, { variant: "outlined", component: Link, to: "/login", sx: {
                        borderColor: "#fff",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        px: 3,
                        py: 1.2,
                        borderRadius: 2,
                        boxShadow: "none",
                        textTransform: "none",
                        fontFamily: "Montserrat, sans-serif",
                        borderWidth: 2,
                        mr: 2,
                        "&:hover": {
                            background: "rgba(255,255,255,0.08)",
                            borderColor: "#fff",
                            boxShadow: "none",
                        },
                    }, children: "Login" }), _jsx(Button, { variant: "contained", component: Link, to: "/get-started", sx: {
                        background: "#F44336",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        px: 3,
                        py: 1.2,
                        borderRadius: 2,
                        boxShadow: "none",
                        textTransform: "none",
                        fontFamily: "Montserrat, sans-serif",
                        "&:hover": {
                            background: "#d32f2f",
                            boxShadow: "none",
                        },
                    }, children: "Get Started" })] }) }));
};
export default Navigation;
