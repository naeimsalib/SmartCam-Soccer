import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Recordings from "./pages/Recordings";
import Navigation from "./components/Navigation";
import { supabase } from "./supabaseClient";
function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Check for existing session on app load
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAuthenticated(!!session);
            setLoading(false);
        });
        // Listen for auth changes
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            setIsAuthenticated(!!session);
        });
        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);
    if (loading)
        return _jsx("div", { children: "Loading..." });
    return (_jsxs(Router, { children: [_jsx(Navigation, { isAuthenticated: isAuthenticated, setIsAuthenticated: setIsAuthenticated }), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingPage, {}) }), _jsx(Route, { path: "/about", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/login", element: isAuthenticated ? (_jsx(Navigate, { to: "/dashboard" })) : (_jsx(LoginPage, { setIsAuthenticated: () => setIsAuthenticated(true) })) }), _jsx(Route, { path: "/dashboard", element: isAuthenticated ? _jsx(Dashboard, {}) : _jsx(Navigate, { to: "/login" }) }), _jsx(Route, { path: "/calendar", element: isAuthenticated ? _jsx(Calendar, {}) : _jsx(Navigate, { to: "/login" }) }), _jsx(Route, { path: "/recordings", element: isAuthenticated ? _jsx(Recordings, {}) : _jsx(Navigate, { to: "/login" }) })] })] }));
}
export default App;
