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
  GlassmorphismCard,
  NetworkStatusIndicator,
  WalletAddressDisplay,
  TokenMetricDisplay,
  BlockchainStatusCard,
} from '../components/CryptoComponents';

import {
  CheckCircle,
  Cancel,
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
  TrendingUp,
  Speed,
  Token,
  Public,
  SwapHoriz,
  Hexagon,
  Timeline,
  Security,
  Refresh,
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

  // Load dashboard data on component mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    console.log('AdminDashboard component mounted');
    loadDashboard();
    fetchAdminData();
  }, []); // Dependencies intentionally omitted to run only on mount

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
      const adminResponse = await fetch('http://localhost:8002/api/admin/dashboard');
      console.log('Admin response status:', adminResponse.status);
      const adminData = await adminResponse.json();
      console.log('Admin data:', adminData);
      
      // Also fetch full project details for complete data
      const projectsResponse = await fetch('http://localhost:8002/api/projects');
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
      const response = await fetch(`http://localhost:8002/api/projects/${projectId}/verification`);
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
      const response = await fetch(`http://localhost:8002/api/admin/projects/${projectId}/review`, {
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
      {/* Dashboard Header with Crypto Elements */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #00D4AA 0%, #3B82F6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Protocol Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Real-time blockchain metrics and smart contract insights
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { loadDashboard(); fetchAdminData(); }}
            disabled={refreshing}
          >
            {refreshing ? 'Syncing...' : 'Sync Chain'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Disconnect
          </Button>
        </Box>
      </Box>
      
      {/* Blockchain Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <BlockchainStatusCard
            title="Smart Contracts"
            status="5 Active"
            icon={SecurityIcon}
            statusColor="#00D4AA"
            details={[
              { label: 'Registry', value: 'Verified' },
              { label: 'Credits', value: 'Minted' },
              { label: 'Oracle', value: 'Live' },
            ]}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <BlockchainStatusCard
            title="Token Metrics"
            status="Active Minting"
            icon={Token}
            statusColor="#3B82F6"
            details={[
              { label: 'Total Supply', value: `${dashboardData?.statistics?.total_projects || projects.length || 0}` },
              { label: 'Circulating', value: `${projects.filter(p => p.status === 'approved').length || 0}` },
              { label: 'Burned', value: '0' },
            ]}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <BlockchainStatusCard
            title="Validation Queue"
            status="Processing"
            icon={PendingIcon}
            statusColor="#F59E0B"
            details={[
              { label: 'Pending', value: `${projects.filter(p => p.status === 'pending_verification' || p.status === 'requires_review').length || 0}` },
              { label: 'In Review', value: `${projects.filter(p => p.status === 'under_review').length || 0}` },
              { label: 'Disputed', value: `${projects.filter(p => p.verification_score < 60).length || 0}` },
            ]}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <BlockchainStatusCard
            title="Network Health"
            status="Optimal"
            icon={Speed}
            statusColor="#10B981"
            details={[
              { label: 'Block Time', value: '2.3s' },
              { label: 'Gas Price', value: '0.02 MATIC' },
              { label: 'Uptime', value: '99.9%' },
            ]}
          />
        </Grid>
      </Grid>

      {/* DeFi Protocol Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <GlassmorphismCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                    }}
                  >
                    <SwapHoriz sx={{ color: '#00D4AA', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Carbon Credit Distribution
                  </Typography>
                </Box>
                <Chip 
                  label="Live" 
                  sx={{ 
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10B981',
                    fontWeight: 600,
                  }} 
                />
              </Box>
              
              {/* Distribution Chart Placeholder */}
              <Box sx={{ 
                height: 200, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
                borderRadius: 2,
                border: '1px solid rgba(0, 212, 170, 0.1)',
              }}>
                <Typography variant="body2" color="textSecondary">
                  📊 Token Distribution Analytics
                </Typography>
              </Box>
            </CardContent>
          </GlassmorphismCard>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <GlassmorphismCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    }}
                  >
                    <AnalyticsIcon sx={{ color: '#3B82F6', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Protocol Performance
                  </Typography>
                </Box>
                <Chip 
                  label="Real-time" 
                  sx={{ 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#3B82F6',
                    fontWeight: 600,
                  }} 
                />
              </Box>
              
              {/* Performance Metrics */}
              <Box sx={{ space: 2 }}>
                {[
                  { label: 'Transaction Success Rate', value: '99.8%', color: '#10B981' },
                  { label: 'Average Verification Time', value: '4.2 min', color: '#3B82F6' },
                  { label: 'Oracle Accuracy', value: '99.95%', color: '#00D4AA' },
                  { label: 'Network Fees (24h)', value: '12.4 MATIC', color: '#8B5CF6' },
                ].map((metric, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: index < 3 ? '1px solid rgba(148, 163, 184, 0.1)' : 'none' }}>
                    <Typography variant="body2" color="textSecondary">
                      {metric.label}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        color: metric.color,
                      }}
                    >
                      {metric.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </GlassmorphismCard>
        </Grid>
      </Grid>

      {/* Recent Smart Contract Events */}
      <GlassmorphismCard>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(0, 212, 170, 0.1) 100%)',
                }}
              >
                <Timeline sx={{ color: '#8B5CF6', fontSize: 24 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Protocol Events
              </Typography>
            </Box>
            <Button variant="outlined" size="small">
              View Explorer
            </Button>
          </Box>
          
          {projects.slice(0, 5).map((project, index) => (
            <Box 
              key={project.id} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                py: 2,
                borderBottom: index < 4 ? '1px solid rgba(148, 163, 184, 0.1)' : 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(project.status) === 'success' ? '#10B981' : 
                                   getStatusColor(project.status) === 'warning' ? '#F59E0B' : '#3B82F6',
                    boxShadow: `0 0 8px ${
                      getStatusColor(project.status) === 'success' ? '#10B981' : 
                      getStatusColor(project.status) === 'warning' ? '#F59E0B' : '#3B82F6'
                    }`,
                  }}
                />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {project.name || `Project ${project.id}`}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Status: {project.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="textSecondary">
                  Verification Score
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {project.verification_score || 'Pending'}
                </Typography>
              </Box>
            </Box>
          ))}
        </CardContent>
      </GlassmorphismCard>
    </Box>
  );

  const renderProjectsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">🔍 Project Management & Review</Typography>
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => { loadDashboard(); fetchAdminData(); }}
            disabled={refreshing}
            sx={{ mr: 2 }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
          >
            Export Data
          </Button>
        </Box>
      </Box>

      {/* Enhanced Projects Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Ecosystem</TableCell>
              <TableCell>Area (ha)</TableCell>
              <TableCell>AI Score</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(projects.length > 0 ? projects : dashboardData?.pending_projects || []).map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.id}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {project.project_name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    by {project.created_by}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={project.ecosystem_type}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{project.area_hectares}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mr: 1 }}>
                      {project.verification_score || 0}/100
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={project.verification_score || 0}
                      sx={{ width: 60, height: 6 }}
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
                  />
                </TableCell>
                <TableCell>
                  {new Date(project.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => openProjectDetails(project)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  
                  {project.location && project.location.lat && project.location.lng && (
                    <Tooltip title="Show in Maps">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => {
                          setSelectedProject(project);
                          setProjectMapDialog(true);
                        }}
                      >
                        <MapIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  <Tooltip title="View IPFS Media">
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => {
                        setSelectedProject(project);
                        setIpfsMediaDialog(true);
                      }}
                    >
                      <MediaIcon />
                    </IconButton>
                  </Tooltip>
                  
                  {(project.status === 'pending_verification' || project.status === 'requires_review' || !project.status) && (
                    <Tooltip title="Review Project">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          setSelectedProject(project);
                          setReviewDialog(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {project.ai_verification && (
                    <Tooltip title="AI Analysis">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => {
                          setSelectedProject(project);
                          setAiAnalysisDialog(true);
                        }}
                      >
                        <SecurityIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Legacy Project Cards for backwards compatibility */}
      {dashboardData?.pending_projects?.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Legacy Projects Pending Review
          </Typography>
          <Grid container spacing={2}>
            {dashboardData.pending_projects.map((project) => (
              <Grid item xs={12} key={project.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">{project.project_name}</Typography>
                        <Typography color="textSecondary">
                          {project.ecosystem_type} • {project.area_hectares} hectares
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Created: {new Date(project.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="contained"
                          color="success"
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
    <Box>
      <Typography variant="h5" gutterBottom>📊 Analytics & Reports</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Carbon Credits Overview
              </Typography>
              <Typography variant="h3" color="primary">
                {projects.reduce((sum, p) => sum + (p.carbon_credits || 0), 0)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total tCO₂ Credits Issued
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🌿 Ecosystem Breakdown
              </Typography>
              {['mangrove', 'seagrass', 'salt_marsh', 'coastal_wetland'].map((ecosystem) => {
                const count = projects.filter(p => p.ecosystem_type === ecosystem).length;
                const percentage = projects.length > 0 ? (count / projects.length) * 100 : 0;
                return (
                  <Box key={ecosystem} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">
                        {ecosystem.replace('_', ' ').toUpperCase()}
                      </Typography>
                      <Typography variant="body2">{count}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Project Status Distribution
              </Typography>
              <Grid container spacing={2}>
                {['approved', 'pending_verification', 'requires_review', 'rejected'].map((status) => {
                  const count = projects.filter(p => p.status === status).length;
                  return (
                    <Grid item xs={6} sm={3} key={status}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color={getStatusColor(status) + '.main'}>
                            {count}
                          </Typography>
                          <Typography variant="body2">
                            {status.replace('_', ' ').toUpperCase()}
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
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
      position: 'relative',
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
    }}>
      <Container maxWidth="xl" sx={{ pt: 4, pb: 4, position: 'relative', zIndex: 1 }}>
        {/* Loading state */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress 
                size={60} 
                sx={{ 
                  color: '#00D4AA',
                  '& .MuiCircularProgress-svg': {
                    filter: 'drop-shadow(0 0 8px rgba(0, 212, 170, 0.3))',
                  }
                }} 
              />
              <Typography variant="h6" sx={{ mt: 2, color: '#1E293B' }}>
                Loading Blockchain Analytics...
              </Typography>
            </Box>
          </Box>
        )}
        
        {/* Error state */}
        {!loading && (!dashboardData && !projects.length) && (
          <GlassmorphismCard sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Alert 
                severity="warning" 
                sx={{ 
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  '& .MuiAlert-icon': { color: '#F59E0B' }
                }}
              >
                Unable to connect to blockchain network. Please check your connection and try again.
                <Button 
                  variant="outlined" 
                  onClick={() => { loadDashboard(); fetchAdminData(); }} 
                  sx={{ ml: 2 }}
                >
                  <Refresh sx={{ mr: 1 }} />
                  Retry Connection
                </Button>
              </Alert>
            </CardContent>
          </GlassmorphismCard>
        )}
        
        {/* Main dashboard content */}
        {!loading && (
          <>
            {/* Header Section with Crypto Branding */}
            <Box sx={{ mb: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #00D4AA 0%, #3B82F6 100%)',
                      boxShadow: '0 8px 32px rgba(0, 212, 170, 0.3)',
                    }}
                  >
                    <Hexagon sx={{ fontSize: 32, color: 'white' }} />
                  </Box>
                  <Box>
                    <Typography 
                      variant="h2" 
                      sx={{ 
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #00D4AA 0%, #3B82F6 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Blue Carbon Protocol
                    </Typography>
                    <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 500 }}>
                      Blockchain-Powered Carbon Credit Administration
                    </Typography>
                  </Box>
                </Box>
                
                {/* Network Status and Wallet */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <NetworkStatusIndicator 
                    networkName="Polygon Amoy" 
                    isConnected={true} 
                    chainId="80002" 
                  />
                  <WalletAddressDisplay 
                    address="0x742d35Cc6639C0532fEb217a8d69Eb53b4e1A532"
                    label="Admin Wallet"
                  />
                </Box>
              </Box>

              {/* Protocol Status Banner */}
              <GlassmorphismCard sx={{ mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Security sx={{ color: '#00D4AA', fontSize: 24 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B' }}>
                      MRV Protocol Status: Active
                    </Typography>
                    <Chip 
                      label="Smart Contracts Verified" 
                      color="primary" 
                      sx={{ 
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                        border: '1px solid rgba(0, 212, 170, 0.3)',
                      }} 
                    />
                    <Chip 
                      label="Oracle Active" 
                      color="secondary" 
                      sx={{ 
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                      }} 
                    />
                  </Box>
                </CardContent>
              </GlassmorphismCard>

              {/* Crypto Metrics Dashboard */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <TokenMetricDisplay
                    label="Total Carbon Credits"
                    value="15,847"
                    change={12.5}
                    icon={Token}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TokenMetricDisplay
                    label="Active Validators"
                    value="24"
                    change={8.3}
                    icon={VerifiedIcon}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TokenMetricDisplay
                    label="Protocol TVL"
                    value="$2.4M"
                    change={-2.1}
                    icon={TrendingUp}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TokenMetricDisplay
                    label="Network TPS"
                    value="847"
                    change={5.7}
                    icon={Speed}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Enhanced Tabs with Crypto Theme */}
            <GlassmorphismCard sx={{ mb: 4 }}>
              <Box sx={{ p: 2 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  sx={{
                    '& .MuiTabs-flexContainer': {
                      gap: 1,
                    },
                  }}
                >
                  <Tab
                    icon={<Timeline />}
                    label="Protocol Analytics"
                    iconPosition="start"
                    sx={{
                      minHeight: 56,
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                        color: '#00D4AA',
                      },
                    }}
                  />
                  <Tab
                    icon={
                      <Badge 
                        badgeContent={projects.filter(p => p.status === 'requires_review' || p.status === 'pending_verification').length} 
                        color="error"
                        sx={{
                          '& .MuiBadge-badge': {
                            backgroundColor: '#EF4444',
                            boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
                          }
                        }}
                      >
                        <SecurityIcon />
                      </Badge>
                    }
                    label="Smart Contract Verification"
                    iconPosition="start"
                    sx={{
                      minHeight: 56,
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                        color: '#00D4AA',
                      },
                    }}
                  />
                  <Tab
                    icon={<AnalyticsIcon />}
                    label="DeFi Analytics"
                    iconPosition="start"
                    sx={{
                      minHeight: 56,
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                        color: '#00D4AA',
                      },
                    }}
                  />
                  <Tab
                    icon={<Public />}
                    label="Network Explorer"
                    iconPosition="start"
                    sx={{
                      minHeight: 56,
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                        color: '#00D4AA',
                      },
                    }}
                  />
                </Tabs>
              </Box>
            </GlassmorphismCard>

            {/* Tab Content */}
            {activeTab === 0 && renderDashboardTab()}
            {activeTab === 1 && renderProjectsTab()}
            {activeTab === 2 && renderAnalyticsTab()}
            {activeTab === 3 && renderMapTab()}
          </>
        )}

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
      </Container>
    </Box>
  );
};

export default AdminDashboard;
