import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';

// Import Leaflet components
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import custom components
import IPFSMediaViewer from '../components/IPFSMediaViewer';

import {
  CheckCircle,
  Cancel,
  Dashboard as DashboardIcon,
  VerifiedUser as VerifiedIcon,
  Warning as WarningIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
  Cancel as RejectedIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Map as MapIcon,
  PhotoLibrary as MediaIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { adminAPI, handleAPIError } from '../services/api';
import { useSnackbar } from 'notistack';

// Fix for Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers for different project statuses
const getMarkerColor = (status) => {
  switch (status) {
    case 'approved': return '#4caf50'; // Green
    case 'requires_review': return '#f44336'; // Red
    case 'pending_verification': return '#ff9800'; // Orange
    case 'submitted': return '#2196f3'; // Blue
    default: return '#9e9e9e'; // Grey
  }
};

// Custom marker icon based on status
const createCustomIcon = (status) => {
  const color = getMarkerColor(status);
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color}; 
      width: 25px; 
      height: 25px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      position: relative;
    "></div>`,
    iconSize: [25, 25],
    iconAnchor: [12.5, 12.5],
    popupAnchor: [0, -12.5]
  });
};

const AdminDashboard = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [dashboardData, setDashboardData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [adminStats, setAdminStats] = useState({
    total_projects: 0,
    pending_review: 0,
    ai_flagged: 0,
    approved: 0,
    rejected: 0,
    total_credits: 0,
    total_revenue: 0,
  });
  
  // Dialog states
  const [reviewDialog, setReviewDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [projectMapDialog, setProjectMapDialog] = useState(false);
  const [ipfsMediaDialog, setIpfsMediaDialog] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [aiAnalysisDialog, setAiAnalysisDialog] = useState(false);
  
  // Review form state
  const [reviewComments, setReviewComments] = useState('');
  const [reviewData, setReviewData] = useState({
    decision: '',
    comments: '',
    credits_awarded: '',
    compliance_notes: '',
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    console.log('AdminDashboard component mounted');
    loadDashboard();
    fetchAdminData();
  }, []);

  const loadDashboard = async () => {
    try {
      console.log('Loading dashboard data...');
      const result = await adminAPI.getDashboard();
      console.log('Dashboard data loaded:', result);
      setDashboardData(result);
    } catch (error) {
      console.error('Dashboard loading error:', error);
      const errorInfo = handleAPIError(error);
      enqueueSnackbar(`Dashboard error: ${errorInfo.message}`, { variant: 'error' });
    }
  };

  const fetchAdminData = async () => {
    setRefreshing(true);
    try {
      console.log('Fetching admin data...');
      
      // Fetch admin dashboard data (includes verification scores)
      const adminResponse = await fetch('https://python-backend-dqu4.onrender.com/api/admin/dashboard');
      console.log('Admin response status:', adminResponse.status);
      const adminData = await adminResponse.json();
      console.log('Admin data:', adminData);
      
      // Also fetch full project details for complete data
      const projectsResponse = await fetch('https://python-backend-dqu4.onrender.com/api/projects');
      const projectsData = await projectsResponse.json();
      const allProjects = projectsData.projects || [];
      
      // Merge admin dashboard data (with scores) with full project details
      const projectsWithScores = (adminData.recent_projects || []).map(adminProject => {
        const fullProject = allProjects.find(p => p.id === adminProject.id) || {};
        return {
          id: adminProject.id,
          project_name: adminProject.project_name,
          status: adminProject.status,
          verification_score: adminProject.verification_score || 0,
          ecosystem_type: fullProject.ecosystem_type || adminProject.ecosystem_type || 'unknown',
          area_hectares: fullProject.area_hectares || adminProject.area_hectares || 0,
          created_at: fullProject.created_at || adminProject.created_at || new Date().toISOString(),
          created_by: fullProject.created_by || adminProject.created_by || 'Unknown',
          ai_verification: fullProject.ai_verification || adminProject.ai_verification || null,
          enhanced_ai_verification: fullProject.enhanced_ai_verification || adminProject.enhanced_ai_verification || null,
          location: fullProject.location || null,
          field_measurements: fullProject.field_measurements || null
        };
      });
      
      setProjects(projectsWithScores);
      setDashboardData(adminData);
      setAdminStats(adminData.statistics || {});
      console.log('Projects with scores:', projectsWithScores);
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      enqueueSnackbar(`Admin data fetch failed: ${error.message}`, { variant: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  const fetchVerificationData = async (projectId) => {
    try {
      console.log('Fetching verification data for project:', projectId);
      const response = await fetch(`https://python-backend-dqu4.onrender.com/api/projects/${projectId}/verification`);
      console.log('Verification response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Verification data received:', data);
        console.log('Enhanced AI verification:', data.enhanced_ai_verification);
        setVerificationData(data);
        return data;
      } else {
        const errorText = await response.text();
        console.warn('No verification data available for project:', projectId, 'Error:', errorText);
        setVerificationData(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching verification data:', error);
      setVerificationData(null);
      return null;
    }
  };

  const openProjectDetails = async (project) => {
    setSelectedProject(project);
    setDetailsDialog(true);
    // Fetch verification data when opening project details
    await fetchVerificationData(project.id);
  };

  const getUnitForMeasurement = (key) => {
    const units = {
      'ph_level': '',
      'temperature': '°C',
      'salinity_ppt': 'ppt',
      'dissolved_oxygen': 'mg/L',
      'turbidity': 'NTU',
      'carbon_content': '%',
      'organic_matter': '%',
      'nitrogen_content': '%',
      'species_count': ' species',
      'vegetation_cover': '%',
      'average_plant_height': 'cm',
      'canopy_cover': '%',
      'root_depth': 'cm'
    };
    return units[key] || '';
  };

  const handleReview = async (action) => {
    try {
      await adminAPI.reviewProject(selectedProject.id, action, reviewComments);
      enqueueSnackbar(`Project ${action}d successfully`, { variant: 'success' });
      setReviewDialog(false);
      setReviewComments('');
      loadDashboard();
      fetchAdminData();
    } catch (error) {
      const errorInfo = handleAPIError(error);
      enqueueSnackbar(errorInfo.message, { variant: 'error' });
    }
  };

  const handleProjectReview = async (projectId, decision) => {
    setLoading(true);
    try {
      const response = await fetch(`https://python-backend-dqu4.onrender.com/api/admin/projects/${projectId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision,
          ...reviewData,
          reviewer_id: 'admin_user',
          review_timestamp: new Date().toISOString(),
        }),
      });
      
      if (response.ok) {
        enqueueSnackbar(`Project ${decision} successfully`, { variant: 'success' });
        fetchAdminData(); // Refresh data
        setReviewDialog(false);
        setReviewData({ decision: '', comments: '', credits_awarded: '', compliance_notes: '' });
      } else {
        throw new Error('Review submission failed');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      enqueueSnackbar('Failed to submit review', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('userInfo');
    localStorage.removeItem('auth_token');
    
    // Navigate to login
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending_verification': return 'warning';
      case 'requires_review': return 'info';
      case 'under_review': return 'primary';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <ApprovedIcon />;
      case 'rejected': return <RejectedIcon />;
      case 'pending_verification': return <PendingIcon />;
      case 'requires_review': return <WarningIcon />;
      case 'under_review': return <VerifiedIcon />;
      default: return <PendingIcon />;
    }
  };

  const renderDashboardTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>🏛️ NCCR Admin Dashboard</Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DashboardIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Projects
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.statistics?.total_projects || projects.length || 0}
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
                <PendingIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Review
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.statistics?.pending_review || projects.filter(p => p.status === 'pending_verification' || p.status === 'requires_review').length || 0}
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
                <ApprovedIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Approved
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData?.statistics?.approved || projects.filter(p => p.status === 'approved').length || 0}
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
                <WarningIcon color="error" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    AI Flagged
                  </Typography>
                  <Typography variant="h4">
                    {projects.filter(p => p.verification_score < 60).length || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent AI Alerts */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🤖 Recent AI Verification Alerts
          </Typography>
          <List>
            {projects
              .filter(p => p.verification_score < 70)
              .slice(0, 5)
              .map((project) => (
                <ListItem key={project.id}>
                  <ListItemIcon>
                    <WarningIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${project.project_name} - Score: ${project.verification_score || 0}/100`}
                    secondary={`Flagged: ${project.ai_verification?.flags?.join(', ') || 'Low verification score'}`}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => openProjectDetails(project)}
                  >
                    Review
                  </Button>
                </ListItem>
              ))}
            {projects.filter(p => p.verification_score < 70).length === 0 && (
              <Alert severity="success">No AI verification alerts at this time</Alert>
            )}
          </List>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔧 System Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Alert severity="success">
                Python Backend: Online (Port 8002)
              </Alert>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Alert severity="success">
                AI Verification: Operational
              </Alert>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderProjectsTab = () => (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4,
        p: 3,
        bgcolor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0'
      }}>
        <Box>
          <Typography variant="h5" sx={{ 
            fontWeight: 700,
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            🔍 Project Management & Review
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Review and approve blue carbon restoration projects
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => { loadDashboard(); fetchAdminData(); }}
            disabled={refreshing}
            variant="outlined"
            sx={{
              borderColor: '#e2e8f0',
              color: '#64748b',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            variant="contained"
            sx={{
              bgcolor: '#0d47a1',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#1565c0' }
            }}
          >
            Export Data
          </Button>
        </Box>
      </Box>

      {/* Enhanced Projects Table */}
      <Card sx={{ 
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0'
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Project ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Ecosystem</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Area (ha)</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>AI Score</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Submitted</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(projects.length > 0 ? projects : dashboardData?.pending_projects || []).map((project, index) => (
                <TableRow 
                  key={project.id}
                  sx={{ 
                    '&:hover': { 
                      bgcolor: '#f8fafc',
                      transform: 'scale(1.001)',
                      transition: 'all 0.2s ease'
                    },
                    '&:nth-of-type(even)': { bgcolor: '#fafbfc' }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0d47a1' }}>
                      #{project.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {project.project_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        by {project.created_by}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.ecosystem_type}
                      size="small"
                      sx={{
                        bgcolor: '#e0f2fe',
                        color: '#0277bd',
                        fontWeight: 600,
                        borderRadius: '8px'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {project.area_hectares}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1, fontWeight: 600 }}>
                        {project.verification_score || 0}/100
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={project.verification_score || 0}
                        sx={{ 
                          width: 60, 
                          height: 8,
                          borderRadius: '4px',
                          bgcolor: '#e2e8f0'
                        }}
                        color={project.verification_score >= 80 ? 'success' : 
                               project.verification_score >= 60 ? 'warning' : 'error'}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(project.status)}
                      label={project.status?.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(project.status)}
                      size="small"
                      sx={{ borderRadius: '8px', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      {new Date(project.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => openProjectDetails(project)}
                          sx={{ 
                            bgcolor: '#e3f2fd',
                            color: '#1976d2',
                            '&:hover': { bgcolor: '#bbdefb' }
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {project.location && project.location.lat && project.location.lng && (
                        <Tooltip title="Show in Maps">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedProject(project);
                              setProjectMapDialog(true);
                            }}
                            sx={{ 
                              bgcolor: '#fce4ec',
                              color: '#c2185b',
                              '&:hover': { bgcolor: '#f8bbd9' }
                            }}
                          >
                            <MapIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      <Tooltip title="View IPFS Media">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedProject(project);
                            setIpfsMediaDialog(true);
                          }}
                          sx={{ 
                            bgcolor: '#e8f5e8',
                            color: '#2e7d32',
                            '&:hover': { bgcolor: '#c8e6c9' }
                          }}
                        >
                          <MediaIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {(project.status === 'pending_verification' || project.status === 'requires_review' || !project.status) && (
                        <Tooltip title="Review Project">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedProject(project);
                              setReviewDialog(true);
                            }}
                            sx={{ 
                              bgcolor: '#fff3e0',
                              color: '#f57c00',
                              '&:hover': { bgcolor: '#ffe0b2' }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {project.ai_verification && (
                        <Tooltip title="AI Analysis">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedProject(project);
                              setAiAnalysisDialog(true);
                            }}
                            sx={{ 
                              bgcolor: '#f3e5f5',
                              color: '#7b1fa2',
                              '&:hover': { bgcolor: '#e1bee7' }
                            }}
                          >
                            <SecurityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Legacy Project Cards for backwards compatibility */}
      {dashboardData?.pending_projects?.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#1e293b' }}>
            Legacy Projects Pending Review
          </Typography>
          <Grid container spacing={2}>
            {dashboardData.pending_projects.map((project) => (
              <Grid item xs={12} key={project.id}>
                <Card sx={{ 
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  '&:hover': { boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }
                }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {project.project_name}
                        </Typography>
                        <Typography sx={{ color: '#64748b' }}>
                          {project.ecosystem_type} • {project.area_hectares} hectares
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, color: '#64748b' }}>
                          Created: {new Date(project.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="contained"
                          sx={{
                            bgcolor: '#059669',
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#047857' }
                          }}
                          startIcon={<CheckCircle />}
                          onClick={() => {
                            setSelectedProject(project);
                            setReviewDialog(true);
                          }}
                        >
                          Review
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );

  const renderAnalyticsTab = () => (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ 
        p: 3,
        bgcolor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        mb: 4
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 700,
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          📊 Analytics & Reports
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
          Comprehensive insights and metrics for blue carbon projects
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Carbon Credits Overview Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  p: 1,
                  mr: 2
                }}>
                  <Typography sx={{ fontSize: '24px' }}>📈</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Carbon Credits Overview
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {projects.reduce((sum, p) => sum + (p.carbon_credits || 0), 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total tCO₂ Credits Issued
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Ecosystem Breakdown Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ 
                  bgcolor: '#e8f5e8',
                  borderRadius: '12px',
                  p: 1,
                  mr: 2
                }}>
                  <Typography sx={{ fontSize: '24px' }}>🌿</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Ecosystem Breakdown
                </Typography>
              </Box>
              {['mangrove', 'seagrass', 'salt_marsh', 'coastal_wetland'].map((ecosystem) => {
                const count = projects.filter(p => p.ecosystem_type === ecosystem).length;
                const percentage = projects.length > 0 ? (count / projects.length) * 100 : 0;
                return (
                  <Box key={ecosystem} sx={{ mb: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {ecosystem.replace('_', ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                        {count} projects
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#0d47a1',
                          borderRadius: 4
                        }
                      }}
                    />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Project Status Distribution Card */}
        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ 
                  bgcolor: '#e3f2fd',
                  borderRadius: '12px',
                  p: 1,
                  mr: 2
                }}>
                  <Typography sx={{ fontSize: '24px' }}>📊</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Project Status Distribution
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {['approved', 'pending_verification', 'requires_review', 'rejected'].map((status) => {
                  const count = projects.filter(p => p.status === status).length;
                  const statusColors = {
                    approved: '#10b981',
                    pending_verification: '#f59e0b',
                    requires_review: '#ef4444',
                    rejected: '#6b7280'
                  };
                  const statusBgColors = {
                    approved: '#dcfce7',
                    pending_verification: '#fef3c7',
                    requires_review: '#fee2e2',
                    rejected: '#f3f4f6'
                  };
                  return (
                    <Grid item xs={6} sm={3} key={status}>
                      <Card sx={{ 
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        bgcolor: statusBgColors[status],
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                          transition: 'all 0.2s ease'
                        }
                      }}>
                        <CardContent sx={{ textAlign: 'center', p: 2 }}>
                          <Typography 
                            variant="h4" 
                            sx={{ 
                              color: statusColors[status],
                              fontWeight: 700,
                              mb: 1
                            }}
                          >
                            {count}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: statusColors[status],
                              fontWeight: 600,
                              textTransform: 'capitalize'
                            }}
                          >
                            {status.replace('_', ' ')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderMapTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🗺️ Project Locations Map
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                View all blue carbon restoration projects on an interactive map
              </Typography>
              
              {/* Map Legend */}
              <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, backgroundColor: '#4caf50', borderRadius: '50%' }}></Box>
                  <Typography variant="caption">Approved</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, backgroundColor: '#f44336', borderRadius: '50%' }}></Box>
                  <Typography variant="caption">Requires Review</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, backgroundColor: '#ff9800', borderRadius: '50%' }}></Box>
                  <Typography variant="caption">Pending Verification</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, backgroundColor: '#2196f3', borderRadius: '50%' }}></Box>
                  <Typography variant="caption">Submitted</Typography>
                </Box>
              </Box>

              {/* Map Container */}
              <Box sx={{ height: '600px', width: '100%', border: '1px solid #ddd', borderRadius: 1 }}>
                <MapContainer
                  center={[20.5937, 78.9629]} // Center of India
                  zoom={5}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Render markers for each project */}
                  {projects.map((project) => {
                    if (project.location && project.location.lat && project.location.lng) {
                      return (
                        <Marker
                          key={project.id}
                          position={[project.location.lat, project.location.lng]}
                          icon={createCustomIcon(project.status)}
                        >
                          <Popup>
                            <Box sx={{ minWidth: 250 }}>
                              <Typography variant="h6" gutterBottom>
                                {project.project_name}
                              </Typography>
                              <Typography variant="body2" color="textSecondary" gutterBottom>
                                <strong>ID:</strong> {project.id}
                              </Typography>
                              <Typography variant="body2" gutterBottom>
                                <strong>Type:</strong> {project.ecosystem_type?.replace('_', ' ') || 'N/A'}
                              </Typography>
                              <Typography variant="body2" gutterBottom>
                                <strong>Area:</strong> {project.area_hectares} hectares
                              </Typography>
                              <Typography variant="body2" gutterBottom>
                                <strong>Status:</strong> 
                                <Chip 
                                  label={project.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'} 
                                  color={getStatusColor(project.status)}
                                  size="small"
                                  sx={{ ml: 1 }}
                                />
                              </Typography>
                              {project.location.address && (
                                <Typography variant="body2" gutterBottom>
                                  <strong>Location:</strong> {project.location.address}
                                </Typography>
                              )}
                              <Typography variant="body2" gutterBottom>
                                <strong>Coordinates:</strong> {project.location.lat.toFixed(4)}, {project.location.lng.toFixed(4)}
                              </Typography>
                              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => openProjectDetails(project)}
                                >
                                  View Details
                                </Button>
                                {(project.status === 'requires_review' || project.status === 'pending_verification') && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => {
                                      setSelectedProject(project);
                                      setReviewDialog(true);
                                    }}
                                  >
                                    Review
                                  </Button>
                                )}
                              </Box>
                            </Box>
                          </Popup>
                        </Marker>
                      );
                    }
                    return null;
                  })}
                </MapContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Map Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📍 Location Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">
                      {projects.filter(p => p.location && p.location.lat && p.location.lng).length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Mapped Projects
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {projects.filter(p => !p.location || !p.location.lat || !p.location.lng).length}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Missing Location
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🌊 Ecosystem Distribution
              </Typography>
              <List dense>
                {Object.entries(
                  projects.reduce((acc, project) => {
                    const ecosystem = project.ecosystem_type || 'unknown';
                    acc[ecosystem] = (acc[ecosystem] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([ecosystem, count]) => (
                  <ListItem key={ecosystem}>
                    <ListItemText
                      primary={ecosystem.replace('_', ' ').toUpperCase()}
                      secondary={`${count} project${count > 1 ? 's' : ''}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Top Navigation */}
      <Box sx={{ 
        bgcolor: 'white',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        py: 2
      }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                bgcolor: '#0d47a1',
                borderRadius: '12px',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DashboardIcon sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ color: '#1e293b', fontWeight: 800 }}>
                  NCCR Admin Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  National Centre for Coastal Research
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="outlined"
              onClick={() => { loadDashboard(); fetchAdminData(); }}
              disabled={refreshing}
              sx={{
                borderColor: '#e2e8f0',
                color: '#64748b',
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {refreshing ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
              Refresh
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Loading state */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ ml: 2 }}>Loading Admin Dashboard...</Typography>
          </Box>
        )}
        
        {/* Error state */}
        {!loading && (!dashboardData && !projects.length) && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 3,
              borderRadius: '12px',
              border: '1px solid #fbbf24'
            }}
          >
            Unable to load dashboard data. Please check your connection and try again.
            <Button variant="outlined" onClick={() => { loadDashboard(); fetchAdminData(); }} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        )}
        
        {/* Main dashboard content */}
        {!loading && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ 
                color: '#1e293b', 
                fontWeight: 800,
                mb: 1
              }}>
                Dashboard Overview
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                Review and approve blue carbon restoration projects for MRV workflow
              </Typography>
            </Box>

            <Box sx={{ 
              borderBottom: '1px solid #e2e8f0', 
              mb: 4,
              bgcolor: 'white',
              borderRadius: '16px 16px 0 0',
              px: 2
            }}>
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '16px',
                    minHeight: '60px',
                    borderRadius: '12px 12px 0 0',
                    '&.Mui-selected': {
                      color: '#0d47a1'
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#0d47a1',
                    height: '3px',
                    borderRadius: '3px'
                  }
                }}
              >
                <Tab
                  icon={<DashboardIcon />}
                  label="Dashboard"
                  iconPosition="start"
                />
                <Tab
                  icon={<Badge badgeContent={projects.filter(p => p.status === 'requires_review' || p.status === 'pending_verification').length} color="error">
                    <VerifiedIcon />
                  </Badge>}
                  label="Project Review"
                  iconPosition="start"
                />
                <Tab
                  icon={<AnalyticsIcon />}
                  label="Analytics"
                  iconPosition="start"
                />
                <Tab
                  icon={<MapIcon />}
                  label="Location Map"
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            <Box sx={{ 
              bgcolor: 'white',
              borderRadius: '0 0 16px 16px',
              p: 3,
              mb: 3,
              border: '1px solid #e2e8f0',
              borderTop: 'none'
            }}>
              {activeTab === 0 && renderDashboardTab()}
              {activeTab === 1 && renderProjectsTab()}
              {activeTab === 2 && renderAnalyticsTab()}
              {activeTab === 3 && renderMapTab()}
            </Box>
          </>
        )}
      </Container>

      {/* Project Map Dialog */}
      <Dialog
        open={projectMapDialog}
        onClose={() => setProjectMapDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          📍 Project Location: {selectedProject?.project_name}
        </DialogTitle>
        <DialogContent>
          {selectedProject && selectedProject.location && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  {/* Project Map */}
                  <Box sx={{ height: '500px', width: '100%', border: '1px solid #ddd', borderRadius: 1 }}>
                    <MapContainer
                      center={[selectedProject.location.lat, selectedProject.location.lng]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      
                      {/* Project marker */}
                      <Marker
                        position={[selectedProject.location.lat, selectedProject.location.lng]}
                        icon={createCustomIcon(selectedProject.status)}
                      >
                        <Popup>
                          <Box sx={{ minWidth: 200 }}>
                            <Typography variant="h6" gutterBottom>
                              {selectedProject.project_name}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Area:</strong> {selectedProject.area_hectares} hectares
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                              <strong>Type:</strong> {selectedProject.ecosystem_type?.replace('_', ' ') || 'N/A'}
                            </Typography>
                          </Box>
                        </Popup>
                      </Marker>

                      {/* Area circle if area data is available */}
                      {selectedProject.area_hectares && (
                        <Circle
                          center={[selectedProject.location.lat, selectedProject.location.lng]}
                          radius={Math.sqrt(selectedProject.area_hectares * 10000) / 2} // Convert hectares to approximate radius in meters
                          pathOptions={{
                            color: getMarkerColor(selectedProject.status),
                            fillColor: getMarkerColor(selectedProject.status),
                            fillOpacity: 0.2,
                            weight: 2
                          }}
                        />
                      )}
                    </MapContainer>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  {/* Project Information */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Project Information
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          <strong>ID:</strong> {selectedProject.id}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Status:</strong> 
                          <Chip 
                            label={selectedProject.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'} 
                            color={getStatusColor(selectedProject.status)}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Ecosystem:</strong> {selectedProject.ecosystem_type?.replace('_', ' ') || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Area:</strong> {selectedProject.area_hectares} hectares
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Restoration Method:</strong> {selectedProject.restoration_method || 'N/A'}
                        </Typography>
                      </Box>

                      <Typography variant="h6" gutterBottom>
                        Location Details
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Latitude:</strong> {selectedProject.location.lat.toFixed(6)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Longitude:</strong> {selectedProject.location.lng.toFixed(6)}
                        </Typography>
                        {selectedProject.location.address && (
                          <Typography variant="body2" color="textSecondary">
                            <strong>Address:</strong> {selectedProject.location.address}
                          </Typography>
                        )}
                      </Box>

                      {selectedProject.field_measurements && (
                        <>
                          <Typography variant="h6" gutterBottom>
                            Field Measurements
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            {selectedProject.field_measurements.water_quality && (
                              <Typography variant="body2" color="textSecondary">
                                <strong>Water pH:</strong> {selectedProject.field_measurements.water_quality.ph_level}
                              </Typography>
                            )}
                            {selectedProject.field_measurements.soil_analysis && (
                              <Typography variant="body2" color="textSecondary">
                                <strong>Soil Carbon:</strong> {selectedProject.field_measurements.soil_analysis.carbon_content}%
                              </Typography>
                            )}
                            {selectedProject.field_measurements.biodiversity && (
                              <Typography variant="body2" color="textSecondary">
                                <strong>Species Count:</strong> {selectedProject.field_measurements.biodiversity.species_count}
                              </Typography>
                            )}
                          </Box>
                        </>
                      )}

                      {selectedProject.carbon_credits > 0 && (
                        <>
                          <Typography variant="h6" gutterBottom>
                            Carbon Credits
                          </Typography>
                          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                            <Typography variant="h4" color="success.main">
                              {selectedProject.carbon_credits}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Credits Awarded
                            </Typography>
                          </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectMapDialog(false)}>
            Close
          </Button>
          {selectedProject && (
            <Button 
              variant="contained"
              onClick={() => {
                setProjectMapDialog(false);
                openProjectDetails(selectedProject);
              }}
            >
              View Full Details
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Enhanced Review Dialog */}
      <Dialog
        open={reviewDialog}
        onClose={() => setReviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Review Project: {selectedProject?.project_name}
        </DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Project Details</Typography>
                  <Typography><strong>ID:</strong> {selectedProject.id}</Typography>
                  <Typography><strong>Ecosystem:</strong> {selectedProject.ecosystem_type}</Typography>
                  <Typography><strong>Area:</strong> {selectedProject.area_hectares} hectares</Typography>
                  <Typography><strong>AI Score:</strong> {selectedProject.verification_score || 0}/100</Typography>
                  <Typography><strong>Status:</strong> {selectedProject.status}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Media Evidence</Typography>
                  <Typography>📷 Photos: {selectedProject.media_count?.photos || 0}</Typography>
                  <Typography>🎥 Videos: {selectedProject.media_count?.videos || 0}</Typography>
                  <Typography>🎙️ Audio: {selectedProject.media_count?.audio || 0}</Typography>
                  <Typography>📄 Documents: {selectedProject.media_count?.documents || 0}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Decision</InputLabel>
                    <Select
                      value={reviewData.decision}
                      onChange={(e) => setReviewData({...reviewData, decision: e.target.value})}
                    >
                      <MenuItem value="approved">Approve</MenuItem>
                      <MenuItem value="rejected">Reject</MenuItem>
                      <MenuItem value="requires_revision">Requires Revision</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Review Comments"
                    value={reviewData.comments || reviewComments}
                    onChange={(e) => {
                      setReviewData({...reviewData, comments: e.target.value});
                      setReviewComments(e.target.value);
                    }}
                    sx={{ mb: 2 }}
                  />
                  {reviewData.decision === 'approved' && (
                    <TextField
                      fullWidth
                      type="number"
                      label="Carbon Credits to Award"
                      value={reviewData.credits_awarded}
                      onChange={(e) => setReviewData({...reviewData, credits_awarded: e.target.value})}
                      sx={{ mb: 2 }}
                    />
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>Cancel</Button>
          <Button
            color="error"
            startIcon={<Cancel />}
            onClick={() => reviewData.decision ? handleProjectReview(selectedProject?.id, 'rejected') : handleReview('reject')}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={() => reviewData.decision ? handleProjectReview(selectedProject?.id, 'approved') : handleReview('approve')}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => {
          setDetailsDialog(false);
          setVerificationData(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Project Details: {selectedProject?.project_name}
        </DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Box sx={{ mt: 2 }}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Basic Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography><strong>Project ID:</strong> {selectedProject.id}</Typography>
                      <Typography><strong>Name:</strong> {selectedProject.project_name}</Typography>
                      <Typography><strong>Ecosystem:</strong> {selectedProject.ecosystem_type}</Typography>
                      <Typography><strong>Area:</strong> {selectedProject.area_hectares} hectares</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography><strong>Status:</strong> {selectedProject.status}</Typography>
                      <Typography><strong>Created:</strong> {new Date(selectedProject.created_at).toLocaleString()}</Typography>
                      <Typography><strong>Created by:</strong> {selectedProject.created_by}</Typography>
                      <Typography><strong>Contact:</strong> {selectedProject.contact_email}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">AI Verification Results</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography><strong>Overall Score:</strong> {verificationData?.verification_score || selectedProject.verification_score || 0}/100</Typography>
                  {(verificationData?.ai_verification || selectedProject.ai_verification) && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">
                        Confidence Level: {verificationData?.ai_verification?.confidence_level || selectedProject.ai_verification?.confidence_level}
                      </Typography>
                      <Typography variant="subtitle2">
                        Status: {verificationData?.ai_verification?.status || selectedProject.ai_verification?.status}
                      </Typography>
                      {(verificationData?.ai_verification?.flags || selectedProject.ai_verification?.flags) && 
                       (verificationData?.ai_verification?.flags || selectedProject.ai_verification?.flags).length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="subtitle2">Flags:</Typography>
                          {(verificationData?.ai_verification?.flags || selectedProject.ai_verification?.flags).map((flag, index) => (
                            <Chip key={index} label={flag} color="warning" size="small" sx={{ mr: 1, mt: 1 }} />
                          ))}
                        </Box>
                      )}
                      {verificationData?.enhanced_ai_verification && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2"><strong>Enhanced AI Analysis:</strong></Typography>
                          <Typography variant="body2">
                            Score: {verificationData.enhanced_ai_verification.overall_score || 0}/100
                          </Typography>
                          <Typography variant="body2">
                            Category: {verificationData.enhanced_ai_verification.category || 'Not specified'}
                          </Typography>
                          <Typography variant="body2">
                            Status: {verificationData.enhanced_ai_verification.status || 'Not specified'}
                          </Typography>
                          {verificationData.enhanced_ai_verification.warnings && verificationData.enhanced_ai_verification.warnings.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="subtitle2">Warnings:</Typography>
                              {verificationData.enhanced_ai_verification.warnings.map((warning, index) => (
                                <Chip key={index} label={warning} color="error" size="small" sx={{ mr: 1, mt: 1 }} />
                              ))}
                            </Box>
                          )}
                          {verificationData.enhanced_ai_verification.recommendations && verificationData.enhanced_ai_verification.recommendations.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="subtitle2">Recommendations:</Typography>
                              {verificationData.enhanced_ai_verification.recommendations.map((rec, index) => (
                                <Chip key={index} label={rec} color="info" size="small" sx={{ mr: 1, mt: 1 }} />
                              ))}
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  )}
                  {verificationData === null && !selectedProject.ai_verification && (
                    <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                      Loading verification data...
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Field Measurements</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {(verificationData?.field_measurements || selectedProject.field_measurements) && (
                    <Grid container spacing={2}>
                      {Object.entries(verificationData?.field_measurements || selectedProject.field_measurements || {}).map(([category, data]) => (
                        <Grid item xs={6} key={category}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {category.replace('_', ' ').toUpperCase()}
                          </Typography>
                          {Object.entries(data || {}).map(([key, value]) => (
                            value && (
                              <Typography key={key} variant="body2">
                                {key.replace('_', ' ')}: {value} {getUnitForMeasurement(key)}
                              </Typography>
                            )
                          ))}
                        </Grid>
                      ))}
                    </Grid>
                  )}
                  {!verificationData?.field_measurements && !selectedProject.field_measurements && verificationData !== null && (
                    <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                      No field measurements data available for this project.
                    </Typography>
                  )}
                  {verificationData === null && (
                    <Typography color="textSecondary" sx={{ fontStyle: 'italic' }}>
                      Loading field measurements data...
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDetailsDialog(false);
            setVerificationData(null);
          }}>Close</Button>
          <Button variant="contained" startIcon={<ShareIcon />}>
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* IPFS Media Viewer Dialog */}
      <IPFSMediaViewer
        open={ipfsMediaDialog}
        onClose={() => setIpfsMediaDialog(false)}
        projectId={selectedProject?.id}
        projectName={selectedProject?.project_name}
      />
    </Box>
  );
};

export default AdminDashboard;
