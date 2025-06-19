import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { AppBar, Toolbar, Button, Box, Typography, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Divider, useTheme, useMediaQuery, } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material";
const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
        setMobileMenuOpen(false);
    };
    const handleNavigation = (path) => {
        navigate(path);
        setMobileMenuOpen(false);
    };
    const handleMobileMenuToggle = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };
    const handleMobileMenuClose = () => {
        setMobileMenuOpen(false);
    };
    const navItems = [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Book Field", path: "/calendar" },
        { label: "Recordings", path: "/recordings" },
        { label: "Settings", path: "/settings" },
        { label: "About", path: "/about-authenticated" },
    ];
    // Mobile Drawer Content
    const mobileDrawerContent = (_jsxs(Box, { sx: {
            width: 280,
            height: "100%",
            background: "#111",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
        }, children: [_jsxs(Box, { sx: {
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }, children: [_jsxs(Typography, { variant: "h5", onClick: () => handleNavigation("/dashboard"), sx: {
                            fontWeight: 900,
                            letterSpacing: 1,
                            color: "#fff",
                            fontFamily: "Montserrat, sans-serif",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                        }, children: [_jsx(Box, { component: "span", sx: { color: "#fff" }, children: "EZ" }), _jsx(Box, { component: "span", sx: { color: "#F44336", ml: 0.5 }, children: "REC" })] }), _jsx(IconButton, { onClick: handleMobileMenuClose, sx: { color: "#fff" }, children: _jsx(CloseIcon, {}) })] }), _jsx(Divider, { sx: { borderColor: "rgba(255, 255, 255, 0.1)" } }), _jsx(List, { sx: { flex: 1, py: 2 }, children: navItems.map((item) => (_jsx(ListItem, { disablePadding: true, children: _jsx(ListItemButton, { onClick: () => handleNavigation(item.path), sx: {
                            px: 3,
                            py: 1.5,
                            borderLeft: location.pathname === item.path
                                ? "4px solid #F44336"
                                : "4px solid transparent",
                            "&:hover": {
                                background: "rgba(244, 67, 54, 0.1)",
                            },
                        }, children: _jsx(ListItemText, { primary: item.label, primaryTypographyProps: {
                                fontFamily: "Montserrat, sans-serif",
                                fontWeight: location.pathname === item.path ? 700 : 500,
                                color: location.pathname === item.path ? "#F44336" : "#fff",
                            } }) }) }, item.path))) }), _jsx(Divider, { sx: { borderColor: "rgba(255, 255, 255, 0.1)" } }), _jsx(Box, { sx: { p: 2 }, children: _jsx(Button, { fullWidth: true, onClick: handleLogout, sx: {
                        color: "#fff",
                        border: "2px solid #F44336",
                        borderRadius: 2,
                        py: 1.5,
                        fontFamily: "Montserrat, sans-serif",
                        fontWeight: 700,
                        textTransform: "none",
                        "&:hover": {
                            background: "#F44336",
                        },
                    }, children: "Logout" }) })] }));
    return (_jsxs(_Fragment, { children: [_jsx(AppBar, { position: "fixed", sx: { background: "#111" }, children: _jsxs(Toolbar, { sx: {
                        justifyContent: "space-between",
                        px: { xs: 2, sm: 3 },
                    }, children: [_jsx(Box, { sx: { display: "flex", alignItems: "center" }, children: _jsxs(Typography, { variant: isMobile ? "h5" : "h4", onClick: () => navigate("/dashboard"), sx: {
                                    fontWeight: 900,
                                    letterSpacing: 1,
                                    color: "#fff",
                                    textDecoration: "none",
                                    fontFamily: "Montserrat, sans-serif",
                                    mr: { xs: 1, md: 4 },
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                }, children: [_jsx(Box, { component: "span", sx: { color: "#fff" }, children: "EZ" }), _jsx(Box, { component: "span", sx: { color: "#F44336", ml: 0.5 }, children: "REC" })] }) }), !isMobile && (_jsx(Box, { sx: { display: "flex", gap: 1 }, children: navItems.map((item) => (_jsx(Button, { color: "inherit", onClick: () => navigate(item.path), sx: {
                                    fontWeight: 700,
                                    fontSize: "0.9rem",
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
                                }, children: item.label }, item.path))) })), _jsxs(Box, { sx: { display: "flex", alignItems: "center" }, children: [!isMobile && (_jsx(Button, { color: "inherit", onClick: handleLogout, sx: {
                                        fontWeight: 700,
                                        fontSize: "0.9rem",
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
                                    }, children: "Logout" })), isMobile && (_jsx(IconButton, { color: "inherit", "aria-label": "open drawer", edge: "start", onClick: handleMobileMenuToggle, sx: { color: "#fff" }, children: _jsx(MenuIcon, {}) }))] })] }) }), _jsx(Drawer, { anchor: "right", open: mobileMenuOpen, onClose: handleMobileMenuClose, PaperProps: {
                    sx: {
                        background: "#111",
                    },
                }, children: mobileDrawerContent })] }));
};
export default Navbar;
