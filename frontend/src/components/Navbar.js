import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AppBar, Toolbar, Button, Box, Typography } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };
    const navItems = [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Book Field", path: "/calendar" },
        { label: "Recordings", path: "/recordings" },
        { label: "Settings", path: "/settings" },
        { label: "About", path: "/about-authenticated" },
    ];
    return (_jsx(AppBar, { position: "fixed", sx: { background: "#111" }, children: _jsxs(Toolbar, { sx: { justifyContent: "space-between" }, children: [_jsx(Box, { sx: { display: "flex", alignItems: "center" }, children: _jsxs(Typography, { variant: "h4", onClick: () => navigate("/dashboard"), sx: {
                            fontWeight: 900,
                            letterSpacing: 1,
                            color: "#fff",
                            textDecoration: "none",
                            fontFamily: "Montserrat, sans-serif",
                            mr: 4,
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                        }, children: [_jsx(Box, { component: "span", sx: { color: "#fff" }, children: "EZ" }), _jsx(Box, { component: "span", sx: { color: "#F44336", ml: 0.5 }, children: "REC" })] }) }), _jsx(Box, { sx: { display: "flex", gap: 2 }, children: navItems.map((item) => (_jsx(Button, { color: "inherit", onClick: () => navigate(item.path), sx: {
                            fontWeight: 700,
                            fontSize: "1rem",
                            letterSpacing: 1,
                            textTransform: "none",
                            fontFamily: "Montserrat, sans-serif",
                            borderBottom: location.pathname === item.path
                                ? "2px solid #F44336"
                                : "2px solid transparent",
                            borderRadius: 0,
                            px: 2,
                            py: 1,
                            transition: "all 0.2s",
                            "&:hover": {
                                background: "rgba(244, 67, 54, 0.1)",
                                borderBottom: "2px solid #F44336",
                            },
                        }, children: item.label }, item.path))) }), _jsx(Button, { color: "inherit", onClick: handleLogout, sx: {
                        fontWeight: 700,
                        fontSize: "1rem",
                        letterSpacing: 1,
                        textTransform: "none",
                        fontFamily: "Montserrat, sans-serif",
                        border: "2px solid #F44336",
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        transition: "all 0.2s",
                        "&:hover": {
                            background: "#F44336",
                            color: "#fff",
                        },
                    }, children: "Logout" })] }) }));
};
export default Navbar;
