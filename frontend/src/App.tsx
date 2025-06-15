import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import ThemeProvider from "./theme/ThemeProvider";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import AuthenticatedAboutPage from "./pages/AuthenticatedAboutPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Recordings from "./pages/Recordings";
import Navigation from "./components/Navigation";
import SettingsPage from "./pages/SettingsPage";
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ThemeProvider>
      <Router>
        <Navigation />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/login"
            element={
              session ? (
                <Navigate to="/dashboard" />
              ) : (
                <LoginPage setIsAuthenticated={() => setSession(true)} />
              )
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={session ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/calendar"
            element={session ? <Calendar /> : <Navigate to="/login" />}
          />
          <Route
            path="/recordings"
            element={session ? <Recordings /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={session ? <SettingsPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/about-authenticated"
            element={
              session ? <AuthenticatedAboutPage /> : <Navigate to="/login" />
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
