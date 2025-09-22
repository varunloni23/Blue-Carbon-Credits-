import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar
} from '@mui/material';
import {
  Nature as NatureIcon,
  AccountCircle as AccountIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PhotoCamera as PhotoIcon,
  LocationOn as LocationIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from 'notistack';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_projects: 0,
    approved_projects: 0,
    pending_projects: 0,
    total_credits: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Fetch user's projects
      const response = await fetch('https://python-backend-dqu4.onrender.com/api/projects');
      const data = await response.json();
      
      if (data.status === 'success') {
        // Filter projects for current user (demo - all projects shown)
        const projects = data.projects || [];
        setUserProjects(projects);
        
        // Calculate user stats
        const approved = projects.filter(p => p.status === 'approved').length;
        const pending = projects.filter(p => ['pending_verification', 'requires_review'].includes(p.status)).length;
        const totalCredits = projects.reduce((sum, p) => sum + (p.carbon_credits || 0), 0);
        
        setDashboardStats({
          total_projects: projects.length,
          approved_projects: approved,
          pending_projects: pending,
          total_credits: totalCredits
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
  };

  const getProjectStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending_verification': return 'warning';
      case 'requires_review': return 'info';
      default: return 'default';
    }
  };

  const getProjectStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon />;
      case 'rejected': return <WarningIcon />;
      case 'pending_verification': return <ScheduleIcon />;
      case 'requires_review': return <AssessmentIcon />;
      default: return <ScheduleIcon />;
    }
  };

  const recentActivities = [
    { icon: <PhotoIcon />, text: 'New photos uploaded to Sundarbans project', time: '2 hours ago' },
    { icon: <LocationIcon />, text: 'GPS waypoints recorded for Seagrass project', time: '1 day ago' },
    { icon: <CheckCircleIcon />, text: 'Mangrove project approved by NCCR', time: '3 days ago' },
    { icon: <AssessmentIcon />, text: 'AI verification completed', time: '5 days ago' }
  ];

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: 'white',
          borderBottom: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NatureIcon sx={{ color: '#0d47a1', fontSize: 32 }} />
            <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 700 }}>
              Blue Carbon MRV
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            size="large"
            edge="end"
            aria-label="account"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            sx={{ 
              bgcolor: '#f1f5f9',
              color: '#64748b',
              '&:hover': { bgcolor: '#e2e8f0' }
            }}
          >
            <AccountIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                mt: 1
              }
            }}
          >
            <MenuItem onClick={() => navigate('/user/projects')} sx={{ borderRadius: '8px', mx: 1 }}>
              My Projects
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ borderRadius: '8px', mx: 1 }}>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ 
            color: '#1e293b', 
            fontWeight: 800,
            mb: 1
          }}>
            Welcome back, {user?.name}!
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
            {user?.organization} • Community Project Manager
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/user/projects/create')}
              sx={{
                bgcolor: '#0d47a1',
                borderRadius: '12px',
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#1565c0' }
              }}
            >
              New Project
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<ViewIcon />}
              onClick={() => navigate('/user/projects')}
              sx={{
                borderColor: '#e2e8f0',
                color: '#64748b',
                borderRadius: '12px',
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { 
                  borderColor: '#0d47a1',
                  color: '#0d47a1',
                  bgcolor: 'transparent'
                }
              }}
            >
              View Projects
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.2s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
                    Total Projects
                  </Typography>
                  <Box sx={{ 
                    bgcolor: '#dbeafe', 
                    borderRadius: '8px', 
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <NatureIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ 
                  color: '#1e293b', 
                  fontWeight: 800,
                  mb: 1
                }}>
                  {dashboardStats.total_projects}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label="+12%" 
                    size="small" 
                    sx={{ 
                      bgcolor: '#dcfce7', 
                      color: '#166534',
                      fontSize: '12px',
                      fontWeight: 600
                    }} 
                  />
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    vs last month
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.2s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
                    Approved Projects
                  </Typography>
                  <Box sx={{ 
                    bgcolor: '#dcfce7', 
                    borderRadius: '8px', 
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 20 }} />
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ 
                  color: '#1e293b', 
                  fontWeight: 800,
                  mb: 1
                }}>
                  {dashboardStats.approved_projects}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label="+8%" 
                    size="small" 
                    sx={{ 
                      bgcolor: '#dcfce7', 
                      color: '#166534',
                      fontSize: '12px',
                      fontWeight: 600
                    }} 
                  />
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    approval rate
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.2s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
                    Pending Review
                  </Typography>
                  <Box sx={{ 
                    bgcolor: '#fef3c7', 
                    borderRadius: '8px', 
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ScheduleIcon sx={{ color: '#d97706', fontSize: 20 }} />
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ 
                  color: '#1e293b', 
                  fontWeight: 800,
                  mb: 1
                }}>
                  {dashboardStats.pending_projects}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label="2 new" 
                    size="small" 
                    sx={{ 
                      bgcolor: '#fef3c7', 
                      color: '#92400e',
                      fontSize: '12px',
                      fontWeight: 600
                    }} 
                  />
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    this week
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              bgcolor: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.2s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
                    Carbon Credits
                  </Typography>
                  <Box sx={{ 
                    bgcolor: '#f0fdf4', 
                    borderRadius: '8px', 
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <TrendingUpIcon sx={{ color: '#16a34a', fontSize: 20 }} />
                  </Box>
                </Box>
                <Typography variant="h3" sx={{ 
                  color: '#1e293b', 
                  fontWeight: 800,
                  mb: 1
                }}>
                  {dashboardStats.total_credits}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label="+24%" 
                    size="small" 
                    sx={{ 
                      bgcolor: '#dcfce7', 
                      color: '#166534',
                      fontSize: '12px',
                      fontWeight: 600
                    }} 
                  />
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    earned
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          {/* Recent Projects */}
          <Grid item xs={12} md={8}>
            <Card sx={{ 
              bgcolor: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700 }}>
                    Recent Projects
                  </Typography>
                  <Button 
                    variant="text" 
                    size="small"
                    onClick={() => navigate('/user/projects')}
                    sx={{ color: '#0d47a1', fontWeight: 600 }}
                  >
                    View All
                  </Button>
                </Box>
                
                {userProjects.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>
                      No projects found
                    </Typography>
                    <Button 
                      variant="contained"
                      onClick={() => navigate('/user/projects/create')}
                      sx={{
                        bgcolor: '#0d47a1',
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      Create your first project
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {userProjects.slice(0, 5).map((project) => (
                      <Box 
                        key={project.id}
                        sx={{ 
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          p: 2,
                          '&:hover': { 
                            bgcolor: '#f8fafc',
                            borderColor: '#0d47a1',
                            transform: 'translateY(-1px)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ 
                              bgcolor: project.status === 'approved' ? '#dcfce7' : project.status === 'pending_verification' ? '#fef3c7' : '#fee2e2',
                              borderRadius: '8px',
                              p: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {getProjectStatusIcon(project.status)}
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                {project.project_name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                {project.ecosystem_type} • {project.area_hectares} hectares
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={project.status?.replace('_', ' ').toUpperCase()}
                              size="small"
                              sx={{
                                bgcolor: project.status === 'approved' ? '#dcfce7' : 
                                        project.status === 'pending_verification' ? '#fef3c7' : '#fee2e2',
                                color: project.status === 'approved' ? '#166534' : 
                                       project.status === 'pending_verification' ? '#92400e' : '#dc2626',
                                fontWeight: 600,
                                fontSize: '11px'
                              }}
                            />
                            {project.verification_score && (
                              <Chip
                                label={`AI: ${project.verification_score}/100`}
                                size="small"
                                sx={{
                                  bgcolor: '#f1f5f9',
                                  color: '#64748b',
                                  fontWeight: 600,
                                  fontSize: '11px'
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              bgcolor: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              mb: 3
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, mb: 3 }}>
                  Recent Activity
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentActivities.map((activity, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 2,
                        p: 2,
                        borderRadius: '10px',
                        '&:hover': { bgcolor: '#f8fafc' }
                      }}
                    >
                      <Box sx={{ 
                        bgcolor: '#f1f5f9',
                        borderRadius: '8px',
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {activity.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                          {activity.text}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {activity.time}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card sx={{ 
              bgcolor: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, mb: 3 }}>
                  Quick Actions
                </Typography>
                
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/user/projects/create')}
                  sx={{ mb: 2 }}
                >
                  Submit New Project
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ViewIcon />}
                  onClick={() => navigate('/user/projects')}
                  sx={{ mb: 2 }}
                >
                  View All Projects
                </Button>
                
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PhotoIcon />}
                  disabled
                >
                  Upload Media (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default UserDashboard;
