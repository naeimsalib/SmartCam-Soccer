import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
const Navigation = ({ isAuthenticated, setIsAuthenticated, }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        navigate('/login');
    };
    return (_jsx(AppBar, { position: "fixed", color: "primary", sx: { mb: 4 }, children: _jsxs(Toolbar, { sx: { justifyContent: 'space-between' }, children: [_jsx(Typography, { variant: "h6", component: Link, to: isAuthenticated ? '/dashboard' : '/', color: "inherit", sx: { textDecoration: 'none', fontWeight: 600 }, children: "SmartCam Soccer" }), _jsxs(Box, { children: [isAuthenticated && (_jsxs(_Fragment, { children: [_jsx(Button, { color: "inherit", component: Link, to: "/dashboard", sx: { fontWeight: 500, mr: 1 }, children: "DASHBOARD" }), _jsx(Button, { color: "inherit", component: Link, to: "/calendar", sx: { fontWeight: 500, mr: 1 }, children: "BOOK FIELD" }), _jsx(Button, { color: "inherit", component: Link, to: "/recordings", sx: {
                                        fontWeight: 500,
                                        mr: 1,
                                        border: location.pathname === '/recordings'
                                            ? '1px solid #fff'
                                            : 'none',
                                    }, children: "RECORDINGS" }), _jsx(Button, { color: "inherit", component: Link, to: "/settings", sx: {
                                        fontWeight: 500,
                                        mr: 1,
                                        border: location.pathname === '/settings'
                                            ? '1px solid #fff'
                                            : 'none',
                                    }, children: "SETTINGS" })] })), _jsx(Button, { color: "inherit", component: Link, to: "/about", sx: {
                                fontWeight: 500,
                                border: location.pathname === '/about' ? '1px solid #fff' : 'none',
                                mr: 1,
                            }, children: "ABOUT" }), isAuthenticated ? (_jsx(Button, { color: "inherit", onClick: handleLogout, sx: { fontWeight: 500 }, children: "LOGOUT" })) : (_jsx(Button, { color: "inherit", component: Link, to: "/login", sx: {
                                fontWeight: 500,
                                border: location.pathname === '/login' ? '1px solid #fff' : 'none',
                            }, children: "LOGIN" }))] })] }) }));
};
export default Navigation;
