import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, } from "react-router-dom";
=======
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, } from "react-router-dom";
import { supabase } from "./supabaseClient";
import ThemeProvider from "./theme/ThemeProvider";
>>>>>>> 771bf45572abf3e65b9e1abda6e4f1021226bdb0
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Recordings from "./pages/Recordings";
import Navigation from "./components/Navigation";
import SettingsPage from "./pages/SettingsPage";
<<<<<<< HEAD
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import AuthenticatedAboutPage from "./pages/AuthenticatedAboutPage";
import { Box } from '@mui/material';
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#90caf9',
        },
        secondary: {
            main: '#f48fb1',
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                html: {
                    width: '100%',
                    height: '100%',
                },
                body: {
                    backgroundColor: '#121212',
                    minHeight: '100vh',
                },
                '#root': {
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    flexGrow: 1,
                },
            },
        },
    },
});
const App = () => {
    return (_jsxs(ThemeProvider, { theme: darkTheme, children: [_jsx(CssBaseline, {}), _jsx(LocalizationProvider, { dateAdapter: AdapterDayjs, children: _jsx(AuthProvider, { children: _jsx(Router, { children: _jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }, children: [_jsx(Navigation, {}), _jsx(Box, { sx: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        width: '100%',
                                        flexGrow: 1, // Allow content to grow vertically
                                    }, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingPage, {}) }), _jsx(Route, { path: "/about", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/features", element: _jsx(FeaturesPage, {}) }), _jsx(Route, { path: "/pricing", element: _jsx(PricingPage, {}) }), _jsx(Route, { path: "/contact", element: _jsx(ContactPage, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/calendar", element: _jsx(ProtectedRoute, { children: _jsx(Calendar, {}) }) }), _jsx(Route, { path: "/recordings", element: _jsx(ProtectedRoute, { children: _jsx(Recordings, {}) }) }), _jsx(Route, { path: "/settings", element: _jsx(ProtectedRoute, { children: _jsx(SettingsPage, {}) }) }), _jsx(Route, { path: "/about-authenticated", element: _jsx(ProtectedRoute, { children: _jsx(AuthenticatedAboutPage, {}) }) })] }) })] }) }) }) })] }));
};
=======
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Check for existing session on app load
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });
        // Listen for auth changes
        const { data: { subscription }, } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);
    if (loading)
        return _jsx("div", { children: "Loading..." });
    return (_jsx(ThemeProvider, { children: _jsxs(Router, { children: [_jsx(Navigation, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingPage, {}) }), _jsx(Route, { path: "/about", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/features", element: _jsx(FeaturesPage, {}) }), _jsx(Route, { path: "/pricing", element: _jsx(PricingPage, {}) }), _jsx(Route, { path: "/contact", element: _jsx(ContactPage, {}) }), _jsx(Route, { path: "/login", element: session ? (_jsx(Navigate, { to: "/dashboard" })) : (_jsx(LoginPage, { setIsAuthenticated: () => setSession(true) })) }), _jsx(Route, { path: "/dashboard", element: session ? _jsx(Dashboard, {}) : _jsx(Navigate, { to: "/login" }) }), _jsx(Route, { path: "/calendar", element: session ? _jsx(Calendar, {}) : _jsx(Navigate, { to: "/login" }) }), _jsx(Route, { path: "/recordings", element: session ? _jsx(Recordings, {}) : _jsx(Navigate, { to: "/login" }) }), _jsx(Route, { path: "/settings", element: session ? _jsx(SettingsPage, {}) : _jsx(Navigate, { to: "/login" }) }), _jsx(Route, { path: "/about-authenticated", element: session ? _jsx(AuthenticatedAboutPage, {}) : _jsx(Navigate, { to: "/login" }) })] })] }) }));
}
>>>>>>> 771bf45572abf3e65b9e1abda6e4f1021226bdb0
export default App;
