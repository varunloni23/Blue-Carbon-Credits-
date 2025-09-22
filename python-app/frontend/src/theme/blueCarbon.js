 import { createTheme } from '@mui/material/styles';

// Blue Carbon MRV System Theme
// Inspired by ocean blues, coastal environments, and professional government interface
const blueCarbonTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0d47a1', // Deep Blue - Professional government blue
      light: '#5472d3',
      dark: '#002171',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00838f', // Teal - Ocean/coastal theme
      light: '#4fb3bf',
      dark: '#005662',
      contrastText: '#ffffff',
    },
    tertiary: {
      main: '#1976d2', // Material Blue
      light: '#63a4ff',
      dark: '#004ba0',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8faff', // Very light blue-tinted white
      paper: '#ffffff',
      hero: 'linear-gradient(135deg, rgba(13, 71, 161, 0.8) 0%, rgba(1, 87, 155, 0.6) 50%, rgba(0, 131, 143, 0.8) 100%)',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
      hint: '#999999',
    },
    success: {
      main: '#2e7d32', // Forest green for verified/approved states
      light: '#60ad5e',
      dark: '#005005',
    },
    warning: {
      main: '#f57c00', // Orange for pending/review states
      light: '#ffad42',
      dark: '#bb4d00',
    },
    error: {
      main: '#d32f2f', // Red for rejected/error states
      light: '#ff6659',
      dark: '#9a0007',
    },
    info: {
      main: '#0288d1', // Light blue for info
      light: '#5eb8ff',
      dark: '#005b9f',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.8rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '2.2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.8rem',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    h5: {
      fontSize: '1.4rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 500,
      lineHeight: 1.45,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      fontSize: '0.95rem',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      letterSpacing: '0.03em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #0d47a1 0%, #01579b 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1565c0 0%, #0277bd 100%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
            backgroundColor: 'rgba(13, 71, 161, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
        elevation8: {
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        },
        elevation24: {
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: 'rgba(13, 71, 161, 0.02)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(13, 71, 161, 0.04)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(13, 71, 161, 0.06)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

export default blueCarbonTheme;