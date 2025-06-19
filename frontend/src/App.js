import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { supabase } from "./supabaseClient";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Recordings from "./pages/Recordings";
import Navigation from "./components/Navigation";
import SettingsPage from "./pages/SettingsPage";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider as MuiThemeProvider, createTheme, } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./contexts/AuthContext";
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import AuthenticatedAboutPage from "./pages/AuthenticatedAboutPage";
import { Box } from "@mui/material";
// Global error handler for authentication errors
const setupGlobalAuthErrorHandler = () => {
    // Handle unhandled promise rejections that might be auth-related
    window.addEventListener("unhandledrejection", async (event) => {
        if (event.reason?.message?.includes("Invalid Refresh Token") ||
            event.reason?.message?.includes("refresh_token") ||
            event.reason?.message?.includes("AuthApiError")) {
            console.warn("Detected auth error, clearing session:", event.reason.message);
            try {
                // Clear local storage
                localStorage.removeItem(`sb-${supabase.supabaseUrl.split("//")[1].split(".")[0]}-auth-token`);
                localStorage.removeItem("supabase.auth.token");
                sessionStorage.clear();
                // Sign out locally
                await supabase.auth.signOut({ scope: "local" });
                // Redirect to login if not already there
                if (!window.location.pathname.includes("/login") &&
                    !window.location.pathname.includes("/") &&
                    window.location.pathname !== "/") {
                    window.location.href = "/login";
                }
            }
            catch (error) {
                console.error("Error handling auth error:", error);
            }
            // Prevent the error from being logged to console
            event.preventDefault();
        }
    });
};
const darkTheme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#90caf9",
        },
        secondary: {
            main: "#f48fb1",
        },
        background: {
            default: "#121212",
            paper: "#1e1e1e",
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                html: {
                    width: "100%",
                    height: "100%",
                },
                body: {
                    backgroundColor: "#121212",
                    minHeight: "100vh",
                },
                "#root": {
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                    flexGrow: 1,
                },
            },
        },
    },
});
const App = () => {
    // Set up global auth error handler
    React.useEffect(() => {
        setupGlobalAuthErrorHandler();
    }, []);
    return (_jsxs(MuiThemeProvider, { theme: darkTheme, children: [_jsx(CssBaseline, {}), _jsx(LocalizationProvider, { dateAdapter: AdapterDayjs, children: _jsx(AuthProvider, { children: _jsx(Router, { future: {
                            v7_startTransition: true,
                            v7_relativeSplatPath: true,
                        }, children: _jsxs(Box, { sx: {
                                display: "flex",
                                flexDirection: "column",
                                minHeight: "100vh",
                                width: "100%",
                            }, children: [_jsx(Navigation, {}), _jsx(Box, { sx: {
                                        display: "flex",
                                        flexDirection: "column",
                                        width: "100%",
                                        flexGrow: 1,
                                    }, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingPage, {}) }), _jsx(Route, { path: "/about", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/features", element: _jsx(FeaturesPage, {}) }), _jsx(Route, { path: "/pricing", element: _jsx(PricingPage, {}) }), _jsx(Route, { path: "/contact", element: _jsx(ContactPage, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/calendar", element: _jsx(ProtectedRoute, { children: _jsx(Calendar, {}) }) }), _jsx(Route, { path: "/recordings", element: _jsx(ProtectedRoute, { children: _jsx(Recordings, {}) }) }), _jsx(Route, { path: "/settings", element: _jsx(ProtectedRoute, { children: _jsx(SettingsPage, {}) }) }), _jsx(Route, { path: "/about-authenticated", element: _jsx(ProtectedRoute, { children: _jsx(AuthenticatedAboutPage, {}) }) })] }) })] }) }) }) })] }));
};
export default App;
