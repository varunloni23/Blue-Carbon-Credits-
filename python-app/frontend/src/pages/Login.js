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
  CircularProgress
} from '@mui/material';
import {
  Nature as NatureIcon,
  Person as UserIcon,
  AdminPanelSettings as AdminIcon,
  Login as LoginIcon
} from '@mui/icons-material';

const Login = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState('user');
  const [message, setMessage] = useState('');

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
      title: 'Community User',
      description: 'Project creation and management',
      icon: <UserIcon />,
      color: 'primary'
    },
    {
      id: 'admin',
      title: 'NCCR Admin',
      description: 'Final approval and oversight',
      icon: <AdminIcon />,
      color: 'secondary'
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
      display: 'flex',
      alignItems: 'center'
    }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left side - Login Form */}
          <Grid item xs={12} md={6}>
            <Paper elevation={8} sx={{ p: 4, borderRadius: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <NatureIcon sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
                <Typography variant="h4" component="h1" gutterBottom>
                  Blue Carbon MRV
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  Monitoring, Reporting & Verification System
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Demo Login Options:
                </Typography>
                <Typography variant="body2">
                  • <strong>Community User:</strong> Create and manage blue carbon projects<br/>
                  • <strong>NCCR Admin:</strong> Final approval and system oversight
                </Typography>
              </Alert>

              {message && (
                <Alert severity={message.includes('successful') ? 'success' : 'error'} sx={{ mb: 3 }}>
                  {message}
                </Alert>
              )}

              {/* User Type Selection */}
              <Typography variant="h6" gutterBottom>
                Select Login Type
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {userTypes.map((type) => (
                  <Grid item xs={6} key={type.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: userType === type.id ? 2 : 1,
                        borderColor: userType === type.id ? `${type.color}.main` : 'grey.300',
                        backgroundColor: userType === type.id ? `${type.color}.50` : 'background.paper',
                        '&:hover': {
                          borderColor: `${type.color}.main`,
                          backgroundColor: `${type.color}.50`,
                        },
                      }}
                      onClick={() => setUserType(type.id)}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Box sx={{ color: `${type.color}.main`, mb: 1 }}>
                          {type.icon}
                        </Box>
                        <Typography variant="subtitle2" fontWeight="bold" fontSize="0.9rem">
                          {type.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" fontSize="0.75rem">
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
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                  sx={{ mt: 3, mb: 2 }}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>

              <Divider sx={{ my: 3 }}>
                <Chip label="Quick Demo Login" />
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
                    size="small"
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
                    size="small"
                  >
                    Demo Admin
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Right side - Features */}
          <Grid item xs={12} md={6}>
            <Box sx={{ pl: { md: 4 } }}>
              <Typography variant="h3" component="h2" gutterBottom>
                🌊 India's Blue Carbon Initiative
              </Typography>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Blockchain-powered MRV system for coastal ecosystem restoration
              </Typography>

              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  🚀 System Features
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    📱 Project Management
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Create and track blue carbon restoration projects with comprehensive data collection
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    🤖 AI Verification
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Automated project verification using machine learning and fraud detection
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    ⛓️ Blockchain Integration
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Secure carbon credit tokenization on Polygon network
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    🏪 Carbon Marketplace
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Trade verified carbon credits with automated payment distribution
                  </Typography>
                </Box>
              </Box>

              <Alert severity="success" sx={{ mt: 3 }}>
                <Typography variant="subtitle2">
                  🌍 Supporting UN SDG 14: Life Below Water
                </Typography>
                <Typography variant="body2">
                  Contributing to India's climate goals through coastal ecosystem restoration
                </Typography>
              </Alert>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Login;
