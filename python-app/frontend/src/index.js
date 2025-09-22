import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#00D4AA', // Crypto emerald
      light: '#4DFFCC',
      dark: '#00B88A',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#3B82F6', // Crypto blue
      light: '#60A5FA',
      dark: '#2563EB',
      contrastText: '#ffffff',
    },
    tertiary: {
      main: '#8B5CF6', // Crypto purple
      light: '#A78BFA',
      dark: '#7C3AED',
    },
    background: {
      default: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
      paper: 'rgba(255, 255, 255, 0.9)',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    warning: {
      main: '#F59E0B',
      light: '#FCD34D',
      dark: '#D97706',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
    divider: 'rgba(148, 163, 184, 0.2)',
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Roboto", "Helvetica Neue", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      background: 'linear-gradient(135deg, #00D4AA 0%, #3B82F6 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      background: 'linear-gradient(135deg, #00D4AA 0%, #3B82F6 100%)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      color: '#1E293B',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      color: '#1E293B',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      color: '#1E293B',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      color: '#1E293B',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
          minHeight: '100vh',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, rgba(0, 212, 170, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
            zIndex: -1,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontWeight: 600,
          boxShadow: '0 4px 14px 0 rgba(0, 212, 170, 0.15)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 25px 0 rgba(0, 212, 170, 0.25)',
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #00D4AA 0%, #3B82F6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #00B88A 0%, #2563EB 100%)',
          },
        },
        outlined: {
          border: '2px solid transparent',
          background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #00D4AA, #3B82F6) border-box',
          '&:hover': {
            background: 'linear-gradient(rgba(0, 212, 170, 0.05), rgba(0, 212, 170, 0.05)) padding-box, linear-gradient(135deg, #00D4AA, #3B82F6) border-box',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 16px 48px 0 rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
        colorPrimary: {
          background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          color: '#00B88A',
          border: '1px solid rgba(0, 212, 170, 0.3)',
        },
        colorSecondary: {
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          color: '#2563EB',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
          minHeight: 56,
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            borderRadius: 12,
            color: '#00B88A',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          borderRadius: 16,
          padding: '8px',
          backdropFilter: 'blur(10px)',
        },
        indicator: {
          display: 'none',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider maxSnack={3}>
            <App />
          </SnackbarProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
