import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  LinearProgress,
  Chip,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Fab,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Nature as EcoIcon,
  AccountBalance as ProjectIcon,
  Store as MarketIcon,
  Add as AddIcon,
  Upload as UploadIcon,
  PhotoCamera as PhotoIcon,
  LocationOn as LocationIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Notifications as NotificationsIcon,
  CloudUpload as CloudUploadIcon,
  Map as MapIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Verified as VerifiedIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Eco as LeafIcon,
  Water as WaterIcon,
  Terrain as TerrainIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

// NGO Dashboard Component - Completely different from user dashboard
const NGODashboard = ({ userProfile }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [verifiedProjects, setVerifiedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [verificationDialog, setVerificationDialog] = useState(false);
  const [fieldData, setFieldData] = useState({
    soilPh: '',
    waterSalinity: '',
    treeCount: '',
    ecosystemHealth: '',
    carbonEstimate: '',
    fieldNotes: '',
    sitePhotos: [],
    gpsCoordinates: ''
  });

  // Fetch projects pending NGO verification
  useEffect(() => {
    fetchPendingProjects();
  }, []);

  const fetchPendingProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8002/api/projects');
      const data = await response.json();
      
      if (data.status === 'success') {
        // Filter projects that need NGO verification (AI verified but not 3rd party verified)
        const projectsNeedingVerification = [];
        const alreadyVerified = [];
        
        for (const project of data.projects) {
          try {
            const statusResponse = await fetch(`http://localhost:8002/api/projects/${project.id}/verification-status`);
            const statusData = await statusResponse.json();
            
            if (statusData.success) {
              const verification = statusData.verification_status;
              if (verification.verification_stages.ai_verification.completed && 
                  !verification.verification_stages.third_party_verification.completed) {
                projectsNeedingVerification.push({...project, verification_status: verification});
              } else if (verification.verification_stages.third_party_verification.completed) {
                alreadyVerified.push({...project, verification_status: verification});
              }
            }
          } catch (err) {
            console.error(`Error fetching status for project ${project.id}:`, err);
          }
        }
        
        setPendingProjects(projectsNeedingVerification);
        setVerifiedProjects(alreadyVerified);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      enqueueSnackbar('Error loading projects', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectVerification = (project) => {
    setSelectedProject(project);
    setVerificationDialog(true);
  };

  const submitVerificationReport = async (action) => {
    if (!selectedProject) return;
    
    try {
      const verificationData = {
        project_id: selectedProject.id,
        action: action, // 'approve' or 'reject'
        field_verification: fieldData,
        ngo_organization: userProfile.organization || userProfile.name,
        verification_date: new Date().toISOString(),
        notes: fieldData.fieldNotes
      };

      const response = await fetch('http://localhost:8002/api/3rd-party/submit-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationData)
      });

      const result = await response.json();
      
      if (result.success || response.ok) {
        enqueueSnackbar(`Project ${action}d successfully`, { variant: 'success' });
        setVerificationDialog(false);
        setSelectedProject(null);
        setFieldData({
          soilPh: '', waterSalinity: '', treeCount: '', ecosystemHealth: '',
          carbonEstimate: '', fieldNotes: '', sitePhotos: [], gpsCoordinates: ''
        });
        fetchPendingProjects(); // Refresh the list
      } else {
        enqueueSnackbar(result.message || 'Error submitting verification', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      enqueueSnackbar('Error submitting verification report', { variant: 'error' });
    }
  };

  const renderNGOOverview = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          NGO Verification Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
          Welcome, {userProfile.organization?.name || userProfile.name}
        </Typography>
      </Grid>

      {/* NGO Stats Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
              <Box>
                <Typography variant="h4">{pendingProjects.length}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Pending Verification
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
              <Box>
                <Typography variant="h4">{verifiedProjects.length}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Verified Projects
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssessmentIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
              <Box>
                <Typography variant="h4">
                  {Math.round((verifiedProjects.length / (pendingProjects.length + verifiedProjects.length) || 0) * 100)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Completion Rate
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <VerifiedIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h4">Active</Typography>
                <Typography variant="body2" color="textSecondary">
                  Verification Status
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Quick Actions for NGOs */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AssessmentIcon />}
                  onClick={() => setActiveTab(1)}
                  sx={{ py: 2 }}
                >
                  Review Applications
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TimelineIcon />}
                  onClick={() => window.open('http://localhost:8005', '_blank')}
                  sx={{ py: 2 }}
                >
                  Status Dashboard
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => setActiveTab(2)}
                  sx={{ py: 2 }}
                >
                  My Reports
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate('/profile')}
                  sx={{ py: 2 }}
                >
                  NGO Profile
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPendingVerifications = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>
          Projects Pending Verification
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Review community applications and provide field verification data
        </Typography>
      </Grid>

      {pendingProjects.length === 0 ? (
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <ScheduleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Pending Verifications
            </Typography>
            <Typography variant="body2" color="textSecondary">
              All projects have been verified or no new applications are available.
            </Typography>
          </Paper>
        </Grid>
      ) : (
        pendingProjects.map((project) => (
          <Grid item xs={12} md={6} key={project.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {project.project_name || 'Untitled Project'}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {project.description || 'No description provided'}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    label={`${project.ecosystem_type || 'Unknown'} Ecosystem`}
                    color="primary" 
                    size="small" 
                    sx={{ mr: 1 }} 
                  />
                  <Chip 
                    label={`${project.area_hectares || 0} hectares`}
                    color="secondary" 
                    size="small" 
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>AI Verification Score:</strong> {project.verification_status?.verification_score || 0}/100
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Status:</strong> Ready for Field Verification
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Submitted:</strong> {new Date(project.created_at).toLocaleDateString()}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AssessmentIcon />}
                  onClick={() => handleProjectVerification(project)}
                >
                  Start Verification
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))
      )}
    </Grid>
  );

  const renderVerificationReports = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>
          Completed Verifications
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Your submitted verification reports
        </Typography>
      </Grid>

      {verifiedProjects.map((project) => (
        <Grid item xs={12} md={6} key={project.id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  {project.project_name || 'Untitled Project'}
                </Typography>
                <Chip 
                  label="Verified" 
                  color="success" 
                  size="small"
                  icon={<CheckCircleIcon />}
                />
              </Box>
              
              <Typography variant="body2" color="textSecondary" paragraph>
                Verified by: {project.verification_status?.verification_stages?.third_party_verification?.organization || userProfile.name}
              </Typography>
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  // Could open detailed report view
                  enqueueSnackbar('Report details coming soon', { variant: 'info' });
                }}
              >
                View Report
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <>
      {/* NGO Dashboard Header */}
      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="h6">
          🏢 NGO Verification Dashboard - {userProfile.organization || 'Verification Organization'}
        </Typography>
        <Typography variant="body2">
          Review and verify community blue carbon projects. Upload field measurements and forward to admin for approval.
        </Typography>
      </Alert>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Overview" />
              <Tab label={`Applications (${pendingProjects.length})`} />
              <Tab label={`Reports (${verifiedProjects.length})`} />
            </Tabs>
          </Box>

          {activeTab === 0 && renderNGOOverview()}
          {activeTab === 1 && renderPendingVerifications()}
          {activeTab === 2 && renderVerificationReports()}
        </>
      )}

      {/* Verification Dialog */}
      <Dialog 
        open={verificationDialog} 
        onClose={() => setVerificationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Field Verification - {selectedProject?.project_name || 'Project'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Complete field verification by filling out the form below
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Soil pH Level"
                type="number"
                value={fieldData.soilPh}
                onChange={(e) => setFieldData({...fieldData, soilPh: e.target.value})}
                inputProps={{ step: "0.1", min: "0", max: "14" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Water Salinity (ppt)"
                type="number"
                value={fieldData.waterSalinity}
                onChange={(e) => setFieldData({...fieldData, waterSalinity: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tree Count"
                type="number"
                value={fieldData.treeCount}
                onChange={(e) => setFieldData({...fieldData, treeCount: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Carbon Estimate (tCO2/year)"
                type="number"
                value={fieldData.carbonEstimate}
                onChange={(e) => setFieldData({...fieldData, carbonEstimate: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ecosystem Health Assessment"
                multiline
                rows={2}
                value={fieldData.ecosystemHealth}
                onChange={(e) => setFieldData({...fieldData, ecosystemHealth: e.target.value})}
                placeholder="Describe the current state of the ecosystem..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Field Notes & Recommendations"
                multiline
                rows={3}
                value={fieldData.fieldNotes}
                onChange={(e) => setFieldData({...fieldData, fieldNotes: e.target.value})}
                placeholder="Additional observations, recommendations, or concerns..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="GPS Coordinates"
                value={fieldData.gpsCoordinates}
                onChange={(e) => setFieldData({...fieldData, gpsCoordinates: e.target.value})}
                placeholder="Latitude, Longitude"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => submitVerificationReport('reject')}
            color="error"
            variant="outlined"
          >
            Reject Project
          </Button>
          <Button 
            onClick={() => submitVerificationReport('approve')}
            variant="contained"
            color="success"
          >
            Approve & Forward to Admin
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const Dashboard = () => {
  // IMMEDIATE DEBUG LOGGING
  console.log('=== DASHBOARD COMPONENT LOADED ===');
  console.log('localStorage userInfo:', localStorage.getItem('userInfo'));
  console.log('localStorage ngo_organization:', localStorage.getItem('ngo_organization'));
  
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalCredits: 0,
    verifiedProjects: 0,
    pendingVerification: 0,
    myProjects: [],
    notifications: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [quickUploadDialog, setQuickUploadDialog] = useState(false);
  
  // Get user info from localStorage to determine role
  const getCurrentUserInfo = () => {
    try {
      const userInfoRaw = localStorage.getItem('userInfo') || '{}';
      const ngoOrgRaw = localStorage.getItem('ngo_organization') || '{}';
      
      console.log('RAW localStorage userInfo:', userInfoRaw);
      console.log('RAW localStorage ngo_organization:', ngoOrgRaw);
      
      const userInfo = JSON.parse(userInfoRaw);
      const ngoOrg = JSON.parse(ngoOrgRaw);
      
      console.log('PARSED userInfo:', userInfo);
      console.log('PARSED ngoOrg:', ngoOrg);
      console.log('userInfo.userType:', userInfo.userType);
      console.log('ngoOrg.id:', ngoOrg.id);
      
      if (userInfo.userType === 'ngo' || ngoOrg.id) {
        console.log('DETECTED NGO USER - returning NGO profile');
        return {
          name: ngoOrg.name || userInfo.name || 'NGO Verifier',
          organization: ngoOrg.name || 'Verification Organization',
          location: ngoOrg.authorized_regions?.[0] || 'India',
          userType: 'ngo',
          orgId: ngoOrg.id
        };
      } else if (userInfo.userType === 'admin') {
        console.log('DETECTED ADMIN USER - returning admin profile');
        return {
          name: userInfo.name || 'NCCR Admin',
          organization: 'National Centre for Coastal Research',
          location: 'Chennai, India',
          userType: 'admin'
        };
      } else {
        console.log('DETECTED COMMUNITY USER - returning community profile');
        return {
          name: userInfo.name || 'Community Member',
          organization: 'Local Environmental Group',
          location: 'Tamil Nadu Coast',
          userType: 'community'
        };
      }
    } catch (e) {
      console.error('ERROR in getCurrentUserInfo:', e);
      return {
        name: 'Community Member',
        organization: 'Local Environmental Group',
        location: 'Tamil Nadu Coast',
        userType: 'community'
      };
    }
  };

  const [userProfile, setUserProfile] = useState(getCurrentUserInfo());

  useEffect(() => {
    // Refresh user profile on component mount
    const refreshedProfile = getCurrentUserInfo();
    console.log('useEffect refreshedProfile:', refreshedProfile);
    setUserProfile(refreshedProfile);
    
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Force re-check user profile when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const refreshedProfile = getCurrentUserInfo();
      console.log('Storage change refreshedProfile:', refreshedProfile);
      setUserProfile(refreshedProfile);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Test Python backend connection
      const statusResponse = await fetch('http://localhost:8002/api/status');
      if (statusResponse.ok) {
        setBackendStatus('connected');
        
        // Fetch user's projects data
        const projectsResponse = await fetch('http://localhost:8002/api/projects');
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          const projects = projectsData.projects || [];
          
          // Filter projects for current user (in real app, would filter by user ID)
          const myProjects = projects.slice(0, 3); // Demo: show first 3 as user's projects
          
          setStats({
            totalProjects: myProjects.length,
            totalCredits: myProjects.reduce((sum, p) => sum + (p.carbon_credits || 0), 0),
            verifiedProjects: myProjects.filter(p => p.status === 'approved').length,
            pendingVerification: myProjects.filter(p => p.status === 'pending_verification' || p.status === 'requires_review').length,
            myProjects: myProjects,
            notifications: [
              { id: 1, type: 'success', message: 'Project "Mangrove Restoration" approved!', time: '2 hours ago' },
              { id: 2, type: 'info', message: 'New AI verification completed', time: '5 hours ago' },
              { id: 3, type: 'warning', message: 'Update required for coastal project', time: '1 day ago' }
            ],
            recentActivity: [
              { id: 1, action: 'Uploaded field measurements', project: 'Seagrass Conservation', time: '3 hours ago' },
              { id: 2, action: 'Submitted for AI verification', project: 'Salt Marsh Restoration', time: '1 day ago' },
              { id: 3, action: 'Received carbon credits', project: 'Mangrove Restoration', time: '2 days ago' }
            ]
          });
        }
      } else {
        setBackendStatus('disconnected');
        enqueueSnackbar('Backend connection failed', { variant: 'warning' });
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setBackendStatus('error');
      enqueueSnackbar('Failed to fetch dashboard data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending_verification': return 'warning';
      case 'requires_review': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon />;
      case 'rejected': return <WarningIcon />;
      case 'pending_verification': return <ScheduleIcon />;
      case 'requires_review': return <AssessmentIcon />;
      default: return <ScheduleIcon />;
    }
  };

  const handleQuickUpload = () => {
    setQuickUploadDialog(false);
    navigate('/projects/create');
  };

  const renderOverviewTab = () => (
    <Box>
      {/* Welcome Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(255,255,255,0.2)' }}>
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" gutterBottom>
                Welcome back, {userProfile.name}!
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                {userProfile.organization} • {userProfile.location}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
                Continue your blue carbon restoration journey. Your efforts are making a real impact on coastal ecosystems.
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => navigate('/projects/create')}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                New Project
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="textSecondary" gutterBottom>
                    My Projects
                  </Typography>
                  <Typography variant="h4">{stats.totalProjects}</Typography>
                </Box>
                <ProjectIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="textSecondary" gutterBottom>
                    Carbon Credits Earned
                  </Typography>
                  <Typography variant="h4">{stats.totalCredits}</Typography>
                </Box>
                <LeafIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="textSecondary" gutterBottom>
                    Verified Projects
                  </Typography>
                  <Typography variant="h4">{stats.verifiedProjects}</Typography>
                </Box>
                <VerifiedIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Review
                  </Typography>
                  <Typography variant="h4">{stats.pendingVerification}</Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions - Different for each user type */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {userProfile.userType === 'ngo' ? '� NGO Verification Actions' : 
             userProfile.userType === 'admin' ? '⚡ Admin Actions' : 
             '�🚀 Quick Actions'}
          </Typography>
          <Grid container spacing={2}>
            {userProfile.userType === 'ngo' ? (
              // NGO-specific actions
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={() => setActiveTab(1)} // Switch to projects tab for verification
                    sx={{ py: 2 }}
                  >
                    Review Projects
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<VerifiedIcon />}
                    onClick={() => window.open('http://localhost:8004', '_blank')}
                    sx={{ py: 2 }}
                  >
                    NGO Portal
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => setQuickUploadDialog(true)}
                    sx={{ py: 2 }}
                  >
                    Upload Report
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TimelineIcon />}
                    onClick={() => window.open('http://localhost:8005', '_blank')}
                    sx={{ py: 2 }}
                  >
                    Status Dashboard
                  </Button>
                </Grid>
              </>
            ) : userProfile.userType === 'admin' ? (
              // Admin-specific actions
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => setActiveTab(1)}
                    sx={{ py: 2 }}
                  >
                    Approve Projects
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={() => setActiveTab(2)}
                    sx={{ py: 2 }}
                  >
                    View Analytics
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SettingsIcon />}
                    onClick={() => navigate('/admin')}
                    sx={{ py: 2 }}
                  >
                    System Settings
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TimelineIcon />}
                    onClick={() => window.open('http://localhost:8005', '_blank')}
                    sx={{ py: 2 }}
                  >
                    Status Dashboard
                  </Button>
                </Grid>
              </>
            ) : (
              // Community user actions (original)
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/projects/create')}
                    sx={{ py: 2 }}
                  >
                    Start New Project
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => setQuickUploadDialog(true)}
                    sx={{ py: 2 }}
                  >
                    Quick Upload
                  </Button>
                </Grid>
              </>
            )}
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<MapIcon />}
                onClick={() => navigate('/data-collection')}
                sx={{ py: 2 }}
              >
                Field Data
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AssessmentIcon />}
                onClick={() => navigate('/reports')}
                sx={{ py: 2 }}
              >
                View Reports
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Project Workflow Guide */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Project Submission Workflow
          </Typography>
          <Stepper orientation="vertical">
            <Step active>
              <StepLabel>
                <Typography variant="subtitle1">Upload Project Data</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="textSecondary">
                  Register your blue carbon project with geo-tagged photos, videos, scientific measurements, and documentation
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => navigate('/projects/create')}>
                  Start Upload
                </Button>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>
                <Typography variant="subtitle1">AI Verification</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="textSecondary">
                  Automated AI system verifies your project data, media authenticity, and measurements
                </Typography>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>
                <Typography variant="subtitle1">NCCR Review</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="textSecondary">
                  NCCR officials review your project for compliance with MRV standards
                </Typography>
              </StepContent>
            </Step>
            <Step>
              <StepLabel>
                <Typography variant="subtitle1">Carbon Credit Issuance</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="textSecondary">
                  Approved projects receive tokenized carbon credits on the blockchain
                </Typography>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>
    </Box>
  );

  // Handler functions for different user types
  const handleNGOVerification = async (projectId, action) => {
    try {
      const response = await fetch(`http://localhost:8002/api/3rd-party/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          org_id: userProfile.orgId,
          project_id: projectId,
          action: action
        })
      });

      if (response.ok) {
        enqueueSnackbar(`Project ${action}d successfully!`, { variant: 'success' });
        fetchDashboardData(); // Refresh data
      } else {
        enqueueSnackbar(`Failed to ${action} project`, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar(`Error: ${error.message}`, { variant: 'error' });
    }
  };

  const handleAdminApproval = async (projectId, action) => {
    try {
      const response = await fetch(`http://localhost:8002/api/admin/projects/${projectId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: action,
          admin_notes: `${action === 'approve' ? 'Approved' : 'Rejected'} by admin`
        })
      });

      if (response.ok) {
        enqueueSnackbar(`Project ${action}d successfully!`, { variant: 'success' });
        fetchDashboardData(); // Refresh data
      } else {
        enqueueSnackbar(`Failed to ${action} project`, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar(`Error: ${error.message}`, { variant: 'error' });
    }
  };

  const renderProjectsTab = () => {
    if (userProfile.userType === 'ngo') {
      return renderNGOProjectsTab();
    } else if (userProfile.userType === 'admin') {
      return renderAdminProjectsTab();
    } else {
      return renderCommunityProjectsTab();
    }
  };

  const renderNGOProjectsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Projects Requiring Verification</Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
        >
          Refresh
        </Button>
      </Box>

      {stats.myProjects.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <VerifiedIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No projects pending verification
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              All assigned projects have been verified. Check back later for new assignments.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AssessmentIcon />}
              onClick={() => window.open('http://localhost:8004', '_blank')}
            >
              Open NGO Portal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {stats.myProjects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" noWrap>
                      {project.project_name}
                    </Typography>
                    <Chip
                      icon={<ScheduleIcon />}
                      label="NEEDS VERIFICATION"
                      color="warning"
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {project.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2">
                      📍 {project.ecosystem_type} • {project.area_hectares} hectares
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleNGOVerification(project.id, 'approve')}
                    >
                      Verify
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<WarningIcon />}
                      onClick={() => handleNGOVerification(project.id, 'reject')}
                    >
                      Reject
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<InfoIcon />}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderAdminProjectsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Projects Pending Admin Approval</Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        {stats.myProjects.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" noWrap>
                    {project.project_name}
                  </Typography>
                  <Chip
                    icon={project.third_party_verified ? <VerifiedIcon /> : <ScheduleIcon />}
                    label={project.third_party_verified ? "NGO VERIFIED" : "PENDING VERIFICATION"}
                    color={project.third_party_verified ? "success" : "warning"}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {project.description}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleAdminApproval(project.id, 'approve')}
                    disabled={!project.third_party_verified}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<WarningIcon />}
                    onClick={() => handleAdminApproval(project.id, 'reject')}
                  >
                    Reject
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderCommunityProjectsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">My Projects</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/projects/create')}
        >
          New Project
        </Button>
      </Box>

      {stats.myProjects.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <EcoIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No projects yet
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              Start your first blue carbon restoration project today!
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/projects/create')}
            >
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {stats.myProjects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" noWrap>
                      {project.project_name}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(project.status)}
                      label={project.status?.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(project.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {project.ecosystem_type} • {project.area_hectares} hectares
                  </Typography>
                  
                  <Box sx={{ my: 2 }}>
                    <Typography variant="caption" display="block">
                      AI Verification Score
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={project.verification_score || 0}
                      sx={{ height: 8, borderRadius: 4 }}
                      color={project.verification_score >= 80 ? 'success' : 
                             project.verification_score >= 60 ? 'warning' : 'error'}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {project.verification_score || 0}/100
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Carbon Credits:</strong> {project.carbon_credits || 0} tCO₂
                  </Typography>
                  
                  <Typography variant="caption" color="textSecondary">
                    Created: {new Date(project.created_at).toLocaleDateString()}
                  </Typography>
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined">
                      View Details
                    </Button>
                    <Button size="small" variant="outlined">
                      Update
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderActivityTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Recent Notifications</Typography>
            </Box>
            <List>
              {stats.notifications.map((notification) => (
                <ListItem key={notification.id}>
                  <ListItemIcon>
                    {notification.type === 'success' ? <CheckCircleIcon color="success" /> :
                     notification.type === 'warning' ? <WarningIcon color="warning" /> :
                     <InfoIcon color="info" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.message}
                    secondary={notification.time}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TimelineIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Recent Activity</Typography>
            </Box>
            <List>
              {stats.recentActivity.map((activity) => (
                <ListItem key={activity.id}>
                  <ListItemIcon>
                    <EcoIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.action}
                    secondary={`${activity.project} • ${activity.time}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Debug logging for user type detection
  console.log('Dashboard userProfile:', userProfile);
  console.log('userProfile.userType:', userProfile.userType);
  console.log('localStorage userInfo:', localStorage.getItem('userInfo'));
  console.log('localStorage ngo_organization:', localStorage.getItem('ngo_organization'));

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Debug indicator for user type */}
      <Alert severity="error" sx={{ mb: 2, fontSize: '1.2rem', fontWeight: 'bold' }}>
        🔍 FORCED DEBUG: User Type = "{userProfile.userType || 'undefined'}" | Name = "{userProfile.name || 'undefined'}" | 
        {userProfile.userType === 'ngo' ? '✅ NGO Dashboard Should Show' : '❌ Regular Dashboard Showing'}
        <br/>LocalStorage UserInfo: {localStorage.getItem('userInfo')}
        <br/>LocalStorage NGO Org: {localStorage.getItem('ngo_organization')}
        <br/>
        <Button 
          variant="outlined" 
          size="small" 
          sx={{ ml: 2 }}
          onClick={() => {
            const refreshedProfile = getCurrentUserInfo();
            console.log('Manual refresh profile:', refreshedProfile);
            setUserProfile(refreshedProfile);
          }}
        >
          Refresh Profile
        </Button>
        <Button 
          variant="outlined" 
          size="small" 
          sx={{ ml: 1 }}
          onClick={() => {
            console.log('ALL localStorage keys:');
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              console.log(`${key}: ${localStorage.getItem(key)}`);
            }
          }}
        >
          Show All Storage
        </Button>
        <Button 
          variant="outlined" 
          size="small" 
          sx={{ ml: 1 }}
          onClick={() => {
            localStorage.setItem('userInfo', JSON.stringify({
              email: 'verify@coastalconservation.in',
              userType: 'ngo',
              name: 'Test NGO'
            }));
            setUserProfile(getCurrentUserInfo());
          }}
        >
          Force NGO
        </Button>
      </Alert>
      
      {/* FORCE NGO DASHBOARD FOR TESTING */}
      <NGODashboard userProfile={userProfile} />
    </Container>
  );
  
  // OLD CONDITIONAL CODE BELOW - TEMPORARILY DISABLED
  /*
      {userProfile.userType === 'ngo' || localStorage.getItem('userInfo')?.includes('ngo') || true ? (
        <NGODashboard userProfile={userProfile} />
      ) : (
        <>
          {/* Backend Status Alert */}
          {backendStatus !== 'connected' && (
            <Alert 
              severity={backendStatus === 'checking' ? 'info' : 'warning'} 
              sx={{ mb: 3 }}
              action={
                <IconButton size="small" onClick={fetchDashboardData}>
                  <RefreshIcon />
                </IconButton>
              }
            >
              {backendStatus === 'checking' ? 'Connecting to backend...' : 
               backendStatus === 'disconnected' ? 'Backend disconnected - Some features may be limited' :
               'Backend connection error - Please check your connection'}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                  <Tab label="Overview" />
                  <Tab label={userProfile.userType === 'admin' ? 'Pending Approvals' : 'My Projects'} />
                  <Tab label={userProfile.userType === 'admin' ? 'System Analytics' : 'Activity'} />
                </Tabs>
              </Box>

              {activeTab === 0 && renderOverviewTab()}
              {activeTab === 1 && renderProjectsTab()}
              {activeTab === 2 && renderActivityTab()}
            </>
          )}
        </>
      )}

      {/* Quick Upload Dialog */}
      <Dialog open={quickUploadDialog} onClose={() => setQuickUploadDialog(false)}>
        <DialogTitle>Quick Project Upload</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Start a new project submission with these quick options:
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PhotoIcon />}
              sx={{ mb: 2 }}
              onClick={handleQuickUpload}
            >
              Upload Photos & Media
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LocationIcon />}
              sx={{ mb: 2 }}
              onClick={handleQuickUpload}
            >
              Add GPS Coordinates
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AssessmentIcon />}
              onClick={handleQuickUpload}
            >
              Enter Field Measurements
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuickUploadDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleQuickUpload}>
            Start Full Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add project"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/projects/create')}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default Dashboard;