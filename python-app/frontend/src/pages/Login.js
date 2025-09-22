import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Avatar,
  Stack,
  Fade,
  Slide,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Nature as NatureIcon,
  Person as UserIcon,
  AdminPanelSettings as AdminIcon,
  Login as LoginIcon,
  Waves as WavesIcon,
  Park as EcoIcon,
  VerifiedUser as VerifiedUserIcon,
  TrendingUp as TrendingUpIcon,
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import heroBackground from '../assets/hero-background.png';

const Login = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState('user');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Simple user/admin login only
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (formData.email && formData.password) {
        const userData = {
          email: formData.email,
          userType: userType,
          loginTime: new Date().toISOString(),
          name: userType === 'admin' ? 'NCCR Administrator' : 'Project Manager'
        };

        localStorage.setItem('userInfo', JSON.stringify(userData));
        localStorage.setItem('auth_token', `demo_token_${userType}_${Date.now()}`);

        setMessage(`Login successful! Welcome, ${userData.name}`);

        setTimeout(() => {
          if (userType === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      } else {
        setMessage('Please enter email and password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoUserType) => {
    setUserType(demoUserType);
    if (demoUserType === 'admin') {
      setFormData({
        email: 'admin@nccr.gov.in',
        password: 'admin123'
      });
    } else {
      setFormData({
        email: 'user@community.org',
        password: 'user123'
      });
    }
  };

  const userTypes = [
    {
      id: 'user',
      title: 'Community',
      subtitle: 'Project Manager',
      description: 'Create and manage blue carbon projects',
      icon: <UserIcon sx={{ fontSize: 28 }} />,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadowColor: 'rgba(102, 126, 234, 0.4)'
    },
    {
      id: 'admin',
      title: 'NCCR',
      subtitle: 'Administrator',
      description: 'Oversee and approve all operations',
      icon: <AdminIcon sx={{ fontSize: 28 }} />,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      shadowColor: 'rgba(240, 147, 251, 0.4)'
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      maxHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: `url(${heroBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    }}>
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, height: 'auto', py: 2 }}>
        {/* Centered Authentication Card */}
        <Paper 
          elevation={24} 
          sx={{ 
            p: { xs: 3, sm: 4 }, 
            borderRadius: 4,
            width: '100%',
            maxWidth: 480,
            mx: 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            WebkitBackdropFilter: 'blur(15px)'
          }}
        >
                {/* Login Header */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar 
                    sx={{ 
                      width: 70, 
                      height: 70, 
                      mx: 'auto', 
                      mb: 2,
                      background: 'linear-gradient(135deg, #0d47a1 0%, #01579b 100%)',
                      boxShadow: '0 4px 20px rgba(13, 71, 161, 0.3)'
                    }}
                  >
                    <NatureIcon sx={{ fontSize: 35 }} />
                  </Avatar>
                  <Typography variant="h4" component="h1" fontWeight="700" sx={{ color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>
                    Welcome Back
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.9)', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                    Sign in to your Blue Carbon MRV account
                  </Typography>
                </Box>

                {message && (
                  <Alert 
                    severity={message.includes('successful') ? 'success' : 'error'} 
                    sx={{ 
                      mb: 2,
                      borderRadius: 2,
                      fontWeight: 500
                    }}
                  >
                    {message}
                  </Alert>
                )}

                {/* User Type Selection */}
                <Typography variant="h6" fontWeight="600" sx={{ mb: 1.5, color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }} gutterBottom>
                  Select User Type
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {userTypes.map((type) => (
                    <Grid item xs={6} key={type.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: 2,
                          borderColor: userType === type.id ? '#0d47a1' : 'rgba(0,0,0,0.12)',
                          backgroundColor: userType === type.id ? 'rgba(13, 71, 161, 0.08)' : 'background.paper',
                          transition: 'all 0.3s ease',
                          borderRadius: 2,
                          '&:hover': {
                            borderColor: '#0d47a1',
                            backgroundColor: 'rgba(13, 71, 161, 0.04)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 20px rgba(13, 71, 161, 0.15)'
                          },
                        }}
                        onClick={() => setUserType(type.id)}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                          <Avatar
                            sx={{
                              backgroundColor: userType === type.id ? '#0d47a1' : 'rgba(13, 71, 161, 0.1)',
                              color: userType === type.id ? 'white' : '#0d47a1',
                              width: 40,
                              height: 40,
                              mx: 'auto',
                              mb: 1.5,
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {type.icon}
                          </Avatar>
                          <Typography variant="subtitle2" fontWeight="700" fontSize="0.95rem" color="#0d47a1">
                            {type.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontSize="0.8rem">
                            {type.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    margin="normal"
                    required
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(13, 71, 161, 0.02)',
                        '&:hover': {
                          backgroundColor: 'rgba(13, 71, 161, 0.04)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(13, 71, 161, 0.06)',
                        }
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    margin="normal"
                    required
                    disabled={loading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(13, 71, 161, 0.02)',
                        '&:hover': {
                          backgroundColor: 'rgba(13, 71, 161, 0.04)',
                        },
                        '&.Mui-focused': {
                          backgroundColor: 'rgba(13, 71, 161, 0.06)',
                        }
                      }
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                    sx={{ 
                      mt: 3, 
                      mb: 2, 
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #0d47a1 0%, #01579b 100%)',
                      boxShadow: '0 4px 20px rgba(13, 71, 161, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1565c0 0%, #0277bd 100%)',
                        boxShadow: '0 6px 25px rgba(13, 71, 161, 0.4)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    {loading ? 'Logging in...' : 'Sign In'}
                  </Button>
                </form>

                <Divider sx={{ my: 3 }}>
                  <Chip 
                    label="Quick Demo Access" 
                    sx={{ 
                      backgroundColor: 'rgba(13, 71, 161, 0.1)',
                      color: '#0d47a1',
                      fontWeight: 600
                    }} 
                  />
                </Divider>

                {/* Demo Login Buttons */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      onClick={() => handleDemoLogin('user')}
                      disabled={loading}
                      startIcon={<UserIcon />}
                      sx={{
                        py: 1.2,
                        borderRadius: 2,
                        borderWidth: 2,
                        fontWeight: 600,
                        '&:hover': {
                          borderWidth: 2,
                          backgroundColor: 'rgba(13, 71, 161, 0.08)',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      Demo User
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleDemoLogin('admin')}
                      disabled={loading}
                      startIcon={<AdminIcon />}
                      sx={{
                        py: 1.2,
                        borderRadius: 2,
                        borderWidth: 2,
                        fontWeight: 600,
                        '&:hover': {
                          borderWidth: 2,
                          backgroundColor: 'rgba(156, 39, 176, 0.08)',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      Demo Admin
                    </Button>
                  </Grid>
                </Grid>

                {/* Footer */}
                <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" color="text.secondary">
                    🌍 Supporting UN SDG 14: Life Below Water
                  </Typography>
                </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
