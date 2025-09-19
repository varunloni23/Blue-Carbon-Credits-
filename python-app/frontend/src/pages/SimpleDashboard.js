import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Nature as EcoIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  PhotoCamera as PhotoIcon,
  LocationOn as LocationIcon,
  Store as MarketIcon,
  AccountBalance as ProjectIcon,
  Verified as VerifiedIcon,
  Payment as PaymentIcon,
  Notifications as NotificationIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

const SimpleDashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    projects: [],
    stats: {
      totalProjects: 0,
      pendingReview: 0,
      approved: 0,
      carbonCredits: 0
    }
  });

  useEffect(() => {
    // Get user info from localStorage
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }

    // Fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:8002/api/projects');
      const data = await response.json();
      
      // Fetch detailed status for each project
      const projectsWithStatus = await Promise.all(
        (data.projects || []).map(async (project) => {
          try {
            const statusResponse = await fetch(`http://localhost:8002/api/projects/${project.id}/verification-status`);
            const statusData = await statusResponse.json();
            return {
              ...project,
              verification_status: statusData.success ? statusData.verification_status : null
            };
          } catch (error) {
            console.warn(`Could not load status for project ${project.id}`);
            return project;
          }
        })
      );
      
      setDashboardData({
        projects: projectsWithStatus,
        stats: {
          totalProjects: projectsWithStatus.length,
          pendingReview: projectsWithStatus.filter(p => p.status === 'pending_verification' || p.status === 'requires_review').length,
          approved: projectsWithStatus.filter(p => p.status === 'approved').length,
          carbonCredits: projectsWithStatus.reduce((sum, p) => sum + (p.carbon_credits || 0), 0),
          thirdPartyVerified: projectsWithStatus.filter(p => p.verification_status?.verification_stages?.third_party_verification?.completed).length,
          blockchainRegistered: projectsWithStatus.filter(p => p.verification_status?.verification_stages?.blockchain_registration?.completed).length
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('userInfo');
    localStorage.removeItem('auth_token');
    
    // Navigate to login
    navigate('/login');
  };

  const quickActions = [
    {
      title: 'Create New Project',
      description: 'Start a new blue carbon restoration project',
      icon: <AddIcon />,
      color: 'primary',
      action: () => navigate('/projects/create')
    },
    {
      title: 'Project Status Tracker',
      description: 'Track verification pipeline progress',
      icon: <ProjectIcon />,
      color: 'secondary',
      action: () => window.open('http://localhost:8005', '_blank')
    },
    {
      title: 'NGO Verification Portal',
      description: 'Access 3rd party verification system',
      icon: <VerifiedIcon />,
      color: 'info',
      action: () => window.open('http://localhost:8004', '_blank')
    },
    {
      title: 'Data Collection',
      description: 'Collect field data and measurements',
      icon: <PhotoIcon />,
      color: 'success',
      action: () => navigate('/data-collection')
    },
    {
      title: 'Marketplace',
      description: 'Trade carbon credits',
      icon: <MarketIcon />,
      color: 'warning',
      action: () => navigate('/marketplace')
    },
    {
      title: 'Carbon Credits',
      description: 'Manage tokenized carbon credits',
      icon: <VerifiedIcon />,
      color: 'info',
      action: () => navigate('/carbon-credits')
    },
    {
      title: 'Payments',
      description: 'Transfer blockchain carbon credits',
      icon: <PaymentIcon />,
      color: 'success',
      action: () => navigate('/payments')
    },
    {
      title: 'Reports',
      description: 'View detailed analytics and reports',
      icon: <LocationIcon />,
      color: 'success',
      action: () => navigate('/reports')
    }
  ];

  const recentActivities = [
    {
      title: 'NGO Verification System Launched',
      description: '3rd party verification portal now available for organizations',
      time: '1 hour ago',
      icon: <VerifiedIcon color="primary" />
    },
    {
      title: 'Project Status Tracker Active',
      description: 'Real-time verification pipeline tracking now available',
      time: '2 hours ago',
      icon: <CheckCircleIcon color="success" />
    },
    {
      title: 'Blockchain Integration Live',
      description: 'Live project registration on Polygon Amoy testnet operational',
      time: '3 hours ago',
      icon: <LocationIcon color="info" />
    },
    {
      title: 'AI Verification Enhanced',
      description: 'Enhanced AI verification with fraud detection active',
      time: '4 hours ago',
      icon: <VerifiedIcon color="secondary" />
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h3" gutterBottom>
              🌊 Welcome to Blue Carbon MRV
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {userInfo ? `Hello, ${userInfo.email}` : 'Community Dashboard'}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Monitor, Report, and Verify your coastal ecosystem restoration projects
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ ml: 2 }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* System Status Alert */}
      <Alert severity="success" sx={{ mb: 3 }}>
        🔗 System Status: All services operational | Backend: Connected | AI Verification: Active
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <ProjectIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Projects
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.stats.totalProjects}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <ScheduleIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Review
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.stats.pendingReview}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <VerifiedIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    NGO Verified
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.stats.thirdPartyVerified || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Approved
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.stats.approved}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'purple', mr: 2 }}>
                  ⛓️
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Blockchain
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.stats.blockchainRegistered || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <EcoIcon />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Carbon Credits
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.stats.carbonCredits}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              🚀 Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { 
                        transform: 'translateY(-2px)',
                        boxShadow: 3 
                      },
                      transition: 'all 0.2s'
                    }}
                    onClick={action.action}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: `${action.color}.main`, mr: 2 }}>
                          {action.icon}
                        </Avatar>
                        <Typography variant="h6">
                          {action.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {action.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">
                📋 Recent Activity
              </Typography>
              <Tooltip title="Notifications">
                <IconButton>
                  <NotificationIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <List>
              {recentActivities.map((activity, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      {activity.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <>
                          <Typography variant="body2" color="textSecondary">
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {activity.time}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < recentActivities.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Recent Projects */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">
                🌱 Recent Projects
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/projects/create')}
              >
                Create New Project
              </Button>
            </Box>
            
            {dashboardData.projects.length === 0 ? (
              <Alert severity="info">
                No projects found. Create your first blue carbon restoration project to get started!
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {dashboardData.projects.slice(0, 6).map((project) => {
                  const verificationStatus = project.verification_status;
                  const stages = verificationStatus?.verification_stages || {};
                  
                  // Calculate progress percentage
                  let progress = 0;
                  if (stages.ai_verification?.completed) progress += 25;
                  if (stages.third_party_verification?.completed) progress += 25;
                  if (stages.admin_review?.completed) progress += 25;
                  if (stages.blockchain_registration?.completed) progress += 25;
                  
                  return (
                    <Grid item xs={12} md={4} key={project.id}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {project.project_name || 'Unnamed Project'}
                          </Typography>
                          
                          <Chip
                            label={project.status?.replace('_', ' ').toUpperCase()}
                            color={project.status === 'approved' ? 'success' : 'warning'}
                            size="small"
                            sx={{ mb: 2 }}
                          />
                          
                          {/* Verification Pipeline Progress */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Verification Progress: {progress}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={progress} 
                              sx={{ height: 8, borderRadius: 1 }}
                            />
                          </Box>
                          
                          {/* Verification Stages */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="textSecondary" display="block">
                              Pipeline Status:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                              <Chip 
                                label="AI" 
                                size="small" 
                                color={stages.ai_verification?.completed ? 'success' : 'default'}
                                variant={stages.ai_verification?.completed ? 'filled' : 'outlined'}
                              />
                              <Chip 
                                label="NGO" 
                                size="small" 
                                color={stages.third_party_verification?.completed ? 'success' : 'default'}
                                variant={stages.third_party_verification?.completed ? 'filled' : 'outlined'}
                              />
                              <Chip 
                                label="Admin" 
                                size="small" 
                                color={stages.admin_review?.completed ? 'success' : 'default'}
                                variant={stages.admin_review?.completed ? 'filled' : 'outlined'}
                              />
                              <Chip 
                                label="⛓️" 
                                size="small" 
                                color={stages.blockchain_registration?.completed ? 'success' : 'default'}
                                variant={stages.blockchain_registration?.completed ? 'filled' : 'outlined'}
                              />
                            </Box>
                          </Box>
                          
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            <strong>Ecosystem:</strong> {project.ecosystem_type}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            <strong>Area:</strong> {project.area_hectares} hectares
                          </Typography>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            <strong>AI Score:</strong> {project.verification_score || 0}/100
                          </Typography>
                          
                          {stages.blockchain_registration?.completed && (
                            <Box sx={{ mt: 2, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                              <Typography variant="caption" color="success.dark">
                                ✅ Blockchain Registered
                              </Typography>
                            </Box>
                          )}
                          
                          {stages.third_party_verification?.organization && (
                            <Box sx={{ mt: 1, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                              <Typography variant="caption" color="info.dark">
                                🏢 Verified by: {stages.third_party_verification.organization}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SimpleDashboard;
