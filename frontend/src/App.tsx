import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { supabase } from "./supabaseClient";
import ThemeProvider from "./theme/ThemeProvider";
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
=======
>>>>>>> 771bf45572abf3e65b9e1abda6e4f1021226bdb0
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import AuthenticatedAboutPage from "./pages/AuthenticatedAboutPage";
import { Box } from '@mui/material';

<<<<<<< HEAD
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
=======
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
>>>>>>> 771bf45572abf3e65b9e1abda6e4f1021226bdb0

const App: React.FC = () => {
  return (
<<<<<<< HEAD
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
          <Router>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
              <Navigation />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  flexGrow: 1, // Allow content to grow vertically
                }}
              >
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/features" element={<FeaturesPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/login" element={<LoginPage />} />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/calendar"
                    element={
                      <ProtectedRoute>
                        <Calendar />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/recordings"
                    element={
                      <ProtectedRoute>
                        <Recordings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/about-authenticated"
                    element={
                      <ProtectedRoute>
                        <AuthenticatedAboutPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Box>
            </Box>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
=======
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
>>>>>>> 771bf45572abf3e65b9e1abda6e4f1021226bdb0
    </ThemeProvider>
  );
};

export default App;
