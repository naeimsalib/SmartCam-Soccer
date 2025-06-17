import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient'; // Import supabase for logout functionality
const Navigation = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [error, setError] = useState(null);
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // For active link styling
    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };
    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/login');
        }
        catch (error) {
            setError('Error signing out. Please try again.');
        }
        handleClose();
    };
    const handleNavigation = (path) => {
        if (path === '/#features') {
            if (location.pathname !== '/') {
                navigate('/');
                // Wait for navigation to complete before scrolling
                setTimeout(() => {
                    const featuresElement = document.getElementById('features');
                    if (featuresElement) {
                        featuresElement.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
            }
            else {
                const featuresElement = document.getElementById('features');
                if (featuresElement) {
                    featuresElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
        else {
            navigate(path);
        }
    };
    const authenticatedNavItems = [
        { label: "Dashboard", path: "/dashboard" },
        { label: "Book Field", path: "/calendar" },
        { label: "Recordings", path: "/recordings" },
        { label: "Settings", path: "/settings" },
        { label: "About", path: "/about-authenticated" },
    ];
    const publicNavItems = [
        { label: "Home", path: "/" },
        { label: "Features", path: "/features" },
        { label: "Pricing", path: "/pricing" },
        { label: "About", path: "/about" },
    ];
    return (_jsx(AppBar, { position: "fixed", sx: { background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }, children: _jsxs(Toolbar, { sx: { width: '100%', maxWidth: 'lg', margin: '0 auto', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx(Box, { sx: { display: 'flex', alignItems: 'center' }, children: _jsxs(Typography, { variant: "h4", onClick: () => navigate(user ? "/dashboard" : "/"), sx: {
                            fontWeight: 900,
                            letterSpacing: 1,
                            color: "#fff",
                            textDecoration: "none",
                            fontFamily: "Montserrat, sans-serif",
                            mr: 4,
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                        }, children: [_jsx(Box, { component: "span", sx: { color: "#fff" }, children: "EZ" }), _jsx(Box, { component: "span", sx: { color: "#F44336", ml: 0.5 }, children: "REC" }), _jsx(FiberManualRecordIcon, { sx: { color: '#F44336', fontSize: 'small', ml: 0.5 } })] }) }), _jsxs(Box, { sx: { display: 'flex', gap: 2 }, children: [(user ? authenticatedNavItems : publicNavItems).map((item) => (_jsx(Button, { color: "inherit", onClick: () => handleNavigation(item.path), sx: {
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
                            }, children: item.label }, item.path))), !user && (_jsx(Button, { color: "inherit", component: RouterLink, to: "/login", sx: {
                                fontWeight: 700,
                                fontSize: "1rem",
                                letterSpacing: 1,
                                textTransform: "none",
                                fontFamily: "Montserrat, sans-serif",
                                borderBottom: location.pathname === "/login"
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
                            }, children: "Sign In" }))] }), _jsx(Box, { sx: { display: 'flex', alignItems: 'center' }, children: user ? (_jsxs(_Fragment, { children: [_jsx(IconButton, { size: "large", "aria-label": "account of current user", "aria-controls": "menu-appbar", "aria-haspopup": "true", onClick: handleMenu, color: "inherit", children: _jsx(AccountCircle, {}) }), _jsx(Menu, { id: "menu-appbar", anchorEl: anchorEl, anchorOrigin: {
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }, keepMounted: true, transformOrigin: {
                                    vertical: 'top',
                                    horizontal: 'right',
                                }, open: Boolean(anchorEl), onClose: handleClose, PaperProps: {
                                    sx: {
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        backdropFilter: 'blur(10px)',
                                        color: '#fff',
                                    },
                                }, children: _jsx(MenuItem, { onClick: handleSignOut, children: "Sign Out" }) })] })) : null })] }) }));
};
export default Navigation;
