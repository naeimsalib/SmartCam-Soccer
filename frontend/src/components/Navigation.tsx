import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

type NavigationProps = {
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
};

const Navigation = ({
  isAuthenticated,
  setIsAuthenticated,
}: NavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <AppBar position="fixed" color="primary" sx={{ mb: 4 }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          component={Link}
          to={isAuthenticated ? '/dashboard' : '/'}
          color="inherit"
          sx={{ textDecoration: 'none', fontWeight: 600 }}
        >
          SmartCam Soccer
        </Typography>
        <Box>
          {isAuthenticated && (
            <>
              <Button
                color="inherit"
                component={Link}
                to="/dashboard"
                sx={{ fontWeight: 500, mr: 1 }}
              >
                DASHBOARD
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/calendar"
                sx={{ fontWeight: 500, mr: 1 }}
              >
                BOOK FIELD
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/recordings"
                sx={{
                  fontWeight: 500,
                  mr: 1,
                  border:
                    location.pathname === '/recordings'
                      ? '1px solid #fff'
                      : 'none',
                }}
              >
                RECORDINGS
              </Button>
              <Button
                color="inherit"
                component={Link}
                to="/settings"
                sx={{
                  fontWeight: 500,
                  mr: 1,
                  border:
                    location.pathname === '/settings'
                      ? '1px solid #fff'
                      : 'none',
                }}
              >
                SETTINGS
              </Button>
            </>
          )}
          <Button
            color="inherit"
            component={Link}
            to="/about"
            sx={{
              fontWeight: 500,
              border:
                location.pathname === '/about' ? '1px solid #fff' : 'none',
              mr: 1,
            }}
          >
            ABOUT
          </Button>
          {isAuthenticated ? (
            <Button
              color="inherit"
              onClick={handleLogout}
              sx={{ fontWeight: 500 }}
            >
              LOGOUT
            </Button>
          ) : (
            <Button
              color="inherit"
              component={Link}
              to="/login"
              sx={{
                fontWeight: 500,
                border:
                  location.pathname === '/login' ? '1px solid #fff' : 'none',
              }}
            >
              LOGIN
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
