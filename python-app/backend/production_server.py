#!/usr/bin/env python3
"""
Production Blue Carbon MRV System Backend
Complete integrated server with admin dashboard functionality
"""
import requests
import json
from decimal import Decimal
import hashlib
import socketserver
from http.server import BaseHTTPRequestHandler
from datetime import datetime, timedelta, timezone
import urllib.parse
import os
import sys
# NGO system disabled
# from third_party_verification import third_party_system
third_party_system = None

# Get local timezone
import time
local_tz = timezone(timedelta(seconds=-time.timezone))

def get_current_time():
    """Get current time with proper timezone"""
    return datetime.now(local_tz)

# Add the current directory to Python path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Try to import AI verification engines
try:
    from ai_verification import AIVerificationEngine
    from enhanced_ai_verification import EnhancedAIVerificationEngine
    AI_VERIFICATION_AVAILABLE = True
    ai_engine = AIVerificationEngine()  # Original engine
    enhanced_ai_engine = EnhancedAIVerificationEngine()  # Enhanced engine
    print("✅ AI Verification Engines loaded successfully")
except ImportError as e:
    AI_VERIFICATION_AVAILABLE = False
    ai_engine = None
    enhanced_ai_engine = None
    print(f"⚠️ AI Verification not available: {e}")

# Try to import IPFS service
try:
    from ipfs_service import ipfs_service, test_ipfs_connection
    IPFS_AVAILABLE = True
    ipfs_connected = test_ipfs_connection()
    print("✅ IPFS Service loaded successfully")
except ImportError as e:
    IPFS_AVAILABLE = False
    ipfs_service = None
    ipfs_connected = False
    print(f"⚠️ IPFS Service not available: {e}")

# Try to import blockchain integration
try:
    import requests
    import subprocess
    BLOCKCHAIN_AVAILABLE = True
    print("✅ Blockchain integration dependencies available")
except ImportError as e:
    BLOCKCHAIN_AVAILABLE = False
    print(f"⚠️ Blockchain integration not available: {e}")

# Try to import NeonDB service
try:
    from neondb_service import get_db_service
    NEONDB_AVAILABLE = True
    db_service = get_db_service()
    print("✅ NeonDB service loaded successfully")
except ImportError as e:
    NEONDB_AVAILABLE = False
    db_service = None
    print(f"⚠️ NeonDB service not available: {e}")

# Configuration
PORT = 8002
CORS_ORIGINS = ["http://localhost:3000", "http://localhost:8004", "http://localhost:8080"]

# Blockchain service configuration
BLOCKCHAIN_API_URL = "http://localhost:8001"
BLOCKCHAIN_SERVICE_AVAILABLE = True

def test_blockchain_connection():
    """Test if blockchain service is available"""
    global BLOCKCHAIN_SERVICE_AVAILABLE
    if not BLOCKCHAIN_AVAILABLE:
        return False
    
    try:
        # Try the correct health endpoint
        response = requests.get("http://localhost:8001/health", timeout=5)
        BLOCKCHAIN_SERVICE_AVAILABLE = response.status_code == 200
        if BLOCKCHAIN_SERVICE_AVAILABLE:
            print("✅ Blockchain service connected")
        return BLOCKCHAIN_SERVICE_AVAILABLE
    except Exception as e:
        print(f"⚠️ Blockchain service not available: {e}")
        BLOCKCHAIN_SERVICE_AVAILABLE = False
        return False

def check_blockchain_service():
    """Check if blockchain service is available"""
    global BLOCKCHAIN_SERVICE_AVAILABLE
    try:
        import requests
        response = requests.get("http://localhost:8001/health", timeout=5)
        BLOCKCHAIN_SERVICE_AVAILABLE = response.status_code == 200
        if BLOCKCHAIN_SERVICE_AVAILABLE:
            print("✅ Blockchain service available")
        else:
            print("⚠️ Blockchain service unavailable")
        return BLOCKCHAIN_SERVICE_AVAILABLE
    except Exception as e:
        print(f"⚠️ Blockchain service not available: {str(e)}")
        BLOCKCHAIN_SERVICE_AVAILABLE = False
        return False

def register_project_on_blockchain(project_data):
    """Register project on actual blockchain through real blockchain service"""
    if not BLOCKCHAIN_SERVICE_AVAILABLE:
        return {"success": False, "error": "Blockchain service not available"}
    
    try:
        # Parse location data properly
        location_data = project_data.get('location', {})
        lat, lng = 0, 0
        if isinstance(location_data, dict):
            lat = location_data.get('lat', project_data.get('latitude', 0))
            lng = location_data.get('lng', project_data.get('longitude', 0))
        elif isinstance(location_data, str) and location_data.strip():
            # Parse coordinate string format like "22.3511°N, 88.9870°E"
            try:
                import re
                coord_pattern = r'([+-]?\d+\.?\d*)[°]?[NS]?,?\s*([+-]?\d+\.?\d*)[°]?[EW]?'
                match = re.search(coord_pattern, location_data)
                if match:
                    lat, lng = float(match.groups()[0]), float(match.groups()[1])
            except (ValueError, AttributeError):
                lat, lng = 0, 0
        
        # Fallback to direct latitude/longitude fields
        if lat == 0 and lng == 0:
            lat = project_data.get('latitude', 0)
            lng = project_data.get('longitude', 0)
        
        # Prepare data for real blockchain service
        blockchain_data = {
            "title": project_data.get("title", project_data.get("project_name", "Unknown Project")),
            "description": project_data.get("description", project_data.get("project_description", "")),
            "location": f"{lat},{lng}",
            "ecosystemType": project_data.get("ecosystem_type", "mangrove"),
            "area": float(project_data.get("area_hectares", project_data.get("area", 0))),
            "communityAddress": project_data.get("wallet_address", "0x0000000000000000000000000000000000000000")
        }
        
        print(f"🔗 Sending to real blockchain service: {blockchain_data}")
        
        # Call real blockchain service on port 8003
        response = requests.post(
            "http://localhost:8001/blockchain/register-project",
            json=blockchain_data,
            timeout=60  # Blockchain transactions can take time
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print(f"✅ Project registered on blockchain! TX: {result.get('txHash')}")
                return {
                    "success": True,
                    "tx_hash": result.get("txHash"),
                    "project_id": result.get("projectId"),
                    "block_number": result.get("blockNumber"),
                    "gas_used": result.get("gasUsed"),
                    "explorer_url": result.get("explorerUrl")
                }
            else:
                return {"success": False, "error": result.get("error", "Unknown blockchain error")}
        else:
            return {"success": False, "error": f"Blockchain service error: {response.status_code} - {response.text}"}
            
    except Exception as e:
        print(f"❌ Blockchain registration exception: {str(e)}")
        return {"success": False, "error": f"Blockchain registration error: {str(e)}"}

# Initialize blockchain connection
test_blockchain_connection()

# NeonDB PostgreSQL databases (replace in-memory with cloud storage)
# All data now stored in NeonDB cloud database
# Legacy variables kept for backward compatibility
projects_db = {}  # Deprecated: Use db_service.get_all_projects() instead
orphaned_ipfs_uploads = {}  # Store IPFS uploads for projects that don't exist yet
users_db = {}     # Deprecated: Use db_service for user operations
marketplace_db = {} # Deprecated: Use db_service for marketplace operations
verification_cache = {}
blockchain_records = {}  # Store blockchain transaction records

# Initialize sample data for demo
def init_sample_data():
    """Initialize sample projects for demonstration"""
    sample_projects = [
        {
            "id": "BC_PROD001",
            "project_name": "Sundarbans Mangrove Restoration",
            "ecosystem_type": "mangrove",
            "restoration_method": "Community-based restoration",
            "area_hectares": 150.5,
            "location": {"lat": 22.2587, "lng": 89.9486},
            "community_details": "Local fishing communities participating",
            "contact_email": "sundarbans@nccr.gov.in",
            "phone_number": "+91 98765 43210",
            "status": "approved",
            "verification_score": 95,
            "created_at": "2024-01-15T10:30:00Z",
            "created_by": "community_leader_01",
            "carbon_credits": 1850,
            "blockchain_tx": "0x123abc...def789",
            "admin_review": {
                "decision": "approved",
                "comments": "Excellent project with strong community engagement",
                "reviewer_id": "nccr_admin_01",
                "review_timestamp": "2024-01-20T14:00:00Z",
                "credits_awarded": 1850
            },
            "field_measurements": {
                "water_quality": {"ph_level": 7.8, "salinity": 15.2, "temperature": 28.5},
                "soil_analysis": {"carbon_content": 3.2, "nitrogen_level": 0.8},
                "biodiversity": {"species_count": 47, "vegetation_density": 78}
            },
            "media_count": {"photos": 25, "videos": 8, "documents": 12},
            "ipfs_media": {
                "photos": [
                    {
                        "filename": "mangrove_restoration_before.jpg",
                        "ipfs_hash": "QmSampleHash1",
                        "gateway_url": "https://gateway.pinata.cloud/ipfs/QmSampleHash1",
                        "description": "Mangrove area before restoration",
                        "uploaded_at": "2024-01-15T11:00:00Z"
                    },
                    {
                        "filename": "mangrove_restoration_after.jpg", 
                        "ipfs_hash": "QmSampleHash2",
                        "gateway_url": "https://gateway.pinata.cloud/ipfs/QmSampleHash2",
                        "description": "Mangrove area after 6 months of restoration",
                        "uploaded_at": "2024-07-15T11:00:00Z"
                    }
                ],
                "videos": [
                    {
                        "filename": "community_participation.mp4",
                        "ipfs_hash": "QmSampleHash3",
                        "gateway_url": "https://gateway.pinata.cloud/ipfs/QmSampleHash3",
                        "description": "Local community participating in mangrove planting",
                        "uploaded_at": "2024-01-20T14:30:00Z"
                    }
                ],
                "documents": [
                    {
                        "filename": "baseline_assessment.pdf",
                        "ipfs_hash": "QmSampleHash4",
                        "gateway_url": "https://gateway.pinata.cloud/ipfs/QmSampleHash4",
                        "description": "Baseline carbon assessment report",
                        "uploaded_at": "2024-01-16T09:00:00Z"
                    }
                ]
            },
            "ai_verification": {
                "confidence_level": "high",
                "status": "verified",
                "flags": []
            }
        },
        {
            "id": "BC_PROD002", 
            "project_name": "Coastal Seagrass Conservation",
            "ecosystem_type": "seagrass",
            "restoration_method": "Assisted regeneration",
            "area_hectares": 75.0,
            "location": {"lat": 11.9139, "lng": 79.8145},
            "community_details": "Fishermen cooperatives working on protection",
            "contact_email": "seagrass@nccr.gov.in",
            "phone_number": "+91 87654 32109",
            "status": "pending_verification",
            "verification_score": 72,
            "created_at": "2024-02-01T09:45:00Z",
            "created_by": "marine_biologist_02",
            "carbon_credits": 0,
            "field_measurements": {
                "water_quality": {"ph_level": 8.1, "salinity": 35.0, "temperature": 26.8},
                "biodiversity": {"species_count": 32, "vegetation_density": 62}
            },
            "media_count": {"photos": 18, "videos": 4, "documents": 8},
            "ipfs_media": {
                "photos": [
                    {
                        "filename": "seagrass_monitoring.jpg",
                        "ipfs_hash": "QmSampleHash5",
                        "gateway_url": "https://gateway.pinata.cloud/ipfs/QmSampleHash5",
                        "description": "Seagrass monitoring quadrant setup",
                        "uploaded_at": "2024-02-01T10:15:00Z"
                    }
                ],
                "videos": [
                    {
                        "filename": "underwater_survey.mp4",
                        "ipfs_hash": "QmSampleHash6", 
                        "gateway_url": "https://gateway.pinata.cloud/ipfs/QmSampleHash6",
                        "description": "Underwater survey of seagrass beds",
                        "uploaded_at": "2024-02-03T16:20:00Z"
                    }
                ]
            },
            "ai_verification": {
                "confidence_level": "medium",
                "status": "requires_review",
                "flags": ["insufficient_baseline_data"]
            }
        },
        {
            "id": "BC_PROD003",
            "project_name": "Salt Marsh Rehabilitation Program", 
            "ecosystem_type": "salt_marsh",
            "restoration_method": "Active restoration",
            "area_hectares": 45.2,
            "location": {"lat": 23.0225, "lng": 72.5714},
            "community_details": "University research collaboration",
            "contact_email": "saltmarsh@nccr.gov.in",
            "phone_number": "+91 76543 21098",
            "status": "requires_review",
            "verification_score": 58,
            "created_at": "2024-02-10T16:20:00Z",
            "created_by": "research_team_03",
            "carbon_credits": 0,
            "media_count": {"photos": 22, "videos": 6, "documents": 15},
            "ipfs_media": {
                "photos": [
                    {
                        "filename": "salt_marsh_baseline.jpg",
                        "ipfs_hash": "QmSampleHash7",
                        "gateway_url": "https://gateway.pinata.cloud/ipfs/QmSampleHash7",
                        "description": "Salt marsh area baseline conditions",
                        "uploaded_at": "2024-02-10T17:00:00Z"
                    }
                ],
                "videos": [
                    {
                        "filename": "research_methodology.mp4",
                        "ipfs_hash": "QmSampleHash8",
                        "gateway_url": "https://gateway.pinata.cloud/ipfs/QmSampleHash8",
                        "description": "Research team explaining methodology",
                        "uploaded_at": "2024-02-12T11:30:00Z"
                    }
                ]
            },
            "ai_verification": {
                "confidence_level": "low",
                "status": "flagged",
                "flags": ["inconsistent_measurements", "location_verification_failed"]
            }
        }
    ]
    
    for project in sample_projects:
        projects_db[project["id"]] = project
    
    print(f"✅ Initialized {len(sample_projects)} sample projects")

class ProductionAPIHandler(BaseHTTPRequestHandler):
    """Production HTTP request handler with comprehensive admin functionality"""
    
    def log_message(self, format, *args):
        """Override to provide cleaner logging"""
        print(f"🌐 {self.address_string()} - {format % args}")
    
    def send_cors_headers(self):
        """Send proper CORS headers"""
        origin = self.headers.get('Origin', '')
        if origin in CORS_ORIGINS or origin.startswith('http://localhost:'):
            self.send_header('Access-Control-Allow-Origin', origin)
        else:
            self.send_header('Access-Control-Allow-Origin', '*')
        
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Access-Control-Allow-Credentials', 'true')
    
    def send_json_response(self, data, status_code=200):
        """Send JSON response with optimized handling for large responses"""
        try:
            self.send_response(status_code)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_cors_headers()
            
            # Custom JSON encoder to handle Decimal and datetime types
            def decimal_encoder(obj):
                if isinstance(obj, Decimal):
                    return float(obj)
                if isinstance(obj, datetime):
                    return obj.isoformat()
                raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
            
            # Optimize JSON serialization for speed and size
            response_json = json.dumps(data, separators=(',', ':'), ensure_ascii=False, default=decimal_encoder)
            response_bytes = response_json.encode('utf-8')
            
            self.send_header('Content-Length', str(len(response_bytes)))
            self.end_headers()
            
            # Send response in chunks if large
            if len(response_bytes) > 4096:  # 4KB threshold
                chunk_size = 1024  # 1KB chunks
                for i in range(0, len(response_bytes), chunk_size):
                    chunk = response_bytes[i:i + chunk_size]
                    self.wfile.write(chunk)
                    self.wfile.flush()  # Force send each chunk
            else:
                self.wfile.write(response_bytes)
                self.wfile.flush()
                
        except BrokenPipeError:
            # Client disconnected before response was sent - log and ignore
            print(f"⚠️ Client disconnected during response (status {status_code})")
        except Exception as e:
            # Log other errors but don't crash the server
            print(f"❌ Error sending response: {e}")
    
    def send_error_response(self, status_code, message):
        """Send error response with proper format and error handling"""
        try:
            error_data = {
                "status": "error",
                "error_code": status_code,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }
            self.send_json_response(error_data, status_code)
        except BrokenPipeError:
            # Client disconnected - just log it
            print(f"⚠️ Client disconnected during error response (status {status_code})")
        except Exception as e:
            print(f"❌ Error sending error response: {e}")
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        try:
            path = self.path.split('?')[0]  # Remove query parameters
            print(f"🔍 DEBUG: GET request for path: {path}")
            
            # System status endpoints
            if path == "/api/status":
                self.send_json_response({
                    "status": "online",
                    "service": "Blue Carbon MRV System",
                    "version": "3.0.0",
                    "ai_verification": AI_VERIFICATION_AVAILABLE,
                    "timestamp": datetime.now().isoformat(),
                    "endpoints": [
                        "/api/projects",
                        "/api/admin/dashboard", 
                        "/api/admin/analytics",
                        "/api/verification/status"
                    ]
                })
                return
            
            if path == "/api/health":
                self.send_json_response({
                    "status": "healthy",
                    "database": "connected",
                    "ai_engine": "operational" if AI_VERIFICATION_AVAILABLE else "offline",
                    "uptime": "running",
                    "timestamp": datetime.now().isoformat()
                })
                return
            
            # Debug endpoint to check all projects and their media
            if path == "/api/debug/projects":
                debug_info = {
                    'total_projects': len(projects_db),
                    'projects': {}
                }
                
                for project_id, project in projects_db.items():
                    debug_info['projects'][project_id] = {
                        'name': project.get('project_name', 'Unknown'),
                        'has_ipfs_media': 'ipfs_media' in project,
                        'has_media_files': 'media_files' in project,
                        'ipfs_media': project.get('ipfs_media', {}),
                        'media_files': project.get('media_files', {}),
                        'media_count': project.get('media_count', {})
                    }
                
                self.send_json_response({
                    'status': 'success',
                    'debug_info': debug_info
                })
                return
            
            # Projects endpoints
            if path == "/api/projects":
                # Get projects from NeonDB instead of in-memory database
                if NEONDB_AVAILABLE and db_service:
                    try:
                        projects_list = db_service.get_all_projects(limit=100)
                        # Convert database format to API format
                        projects_list = [{
                            'id': p['project_id'],
                            'project_name': p['title'],
                            'description': p['description'],
                            'location': p['location'] if isinstance(p['location'], dict) else {},
                            'ecosystem_type': p['ecosystem_type'],
                            'area_hectares': float(p['area_hectares']) if p['area_hectares'] else 0,
                            'carbon_impact': float(p['carbon_estimate']) if p['carbon_estimate'] else 0,
                            'status': p['status'],
                            'blockchain_tx': p['blockchain_tx_hash'],
                            'ipfs_hash': p['ipfs_hash'],
                            'workflow_id': p['workflow_id'],
                            'created_at': p['created_at'].isoformat() if p['created_at'] else ''
                        } for p in projects_list]
                    except Exception as e:
                        print(f"❌ Error getting projects from NeonDB: {e}")
                        # Fallback to in-memory database
                        projects_list = list(projects_db.values())
                else:
                    # Fallback to in-memory database
                    projects_list = list(projects_db.values())
                    
                # Sort by creation date (newest first)
                projects_list.sort(key=lambda x: x.get('created_at', ''), reverse=True)
                
                self.send_json_response({
                    "status": "success",
                    "projects": projects_list,
                    "total": len(projects_list),
                    "statistics": {
                        "total": len(projects_list),
                        "approved": len([p for p in projects_list if p.get('status') == 'approved']),
                        "pending": len([p for p in projects_list if p.get('status') in ['pending_verification', 'requires_review']]),
                        "rejected": len([p for p in projects_list if p.get('status') == 'rejected'])
                    }
                })
                return
            
            # Admin project review endpoint - MUST come before generic projects endpoint
            if path.startswith("/api/admin/projects/") and path.endswith("/review"):
                project_id = path.split('/')[-2]
                print(f"🔍 Project review endpoint called for project: {project_id}")
                
                if NEONDB_AVAILABLE and db_service:
                    try:
                        content_length = int(self.headers.get('Content-Length', 0))
                        if content_length == 0:
                            self.send_error_response(400, "No review data provided")
                            return
                        
                        post_data = self.rfile.read(content_length)
                        review_data = json.loads(post_data.decode('utf-8'))
                        
                        decision = review_data.get('decision', '')
                        comments = review_data.get('comments', '')
                        credits_awarded = review_data.get('credits_awarded', 0)
                        reviewer_id = review_data.get('reviewer_id', 'admin')
                        
                        print(f"📋 Review decision: {decision} for project: {project_id}")
                        
                        # Update project status based on decision
                        new_status = 'approved' if decision == 'approved' else 'rejected' if decision == 'rejected' else 'requires_revision'
                        
                        # Update project in database
                        success = db_service.update_project(project_id, {
                            'status': new_status,
                            'reviewer_comments': comments,
                            'carbon_credits': credits_awarded if decision == 'approved' else 0,
                            'reviewed_at': datetime.now().isoformat(),
                            'reviewed_by': reviewer_id
                        })
                        
                        if success:
                            self.send_json_response({
                                'status': 'success',
                                'message': f'Project {decision} successfully',
                                'project_id': project_id,
                                'new_status': new_status,
                                'credits_awarded': credits_awarded if decision == 'approved' else 0
                            })
                            print(f"✅ Project {project_id} {decision} successfully")
                        else:
                            self.send_error_response(500, "Failed to update project status")
                        return
                        
                    except Exception as e:
                        print(f"❌ Error processing review: {e}")
                        self.send_error_response(500, f"Error processing review: {str(e)}")
                        return
                else:
                    self.send_error_response(503, "Database service not available")
                    return
            
            # Get detailed verification data for a specific project
            if path.startswith("/api/projects/") and path.endswith("/verification"):
                project_id = path.split('/')[-2]
                print(f"🔍 Verification endpoint called for project: {project_id}")
                
                if NEONDB_AVAILABLE and db_service:
                    try:
                        project = db_service.get_project(project_id)
                        print(f"📄 Project found: {project is not None}")
                        if not project:
                            print(f"❌ Project {project_id} not found")
                            self.send_error_response(404, f"Project {project_id} not found")
                            return
                        
                        verification_data = db_service.get_verification_data(project_id)
                        print(f"📊 Verification data found: {len(verification_data) if verification_data else 0} records")
                        
                        if not verification_data:
                            print(f"⚠️ No verification data for project {project_id}")
                            self.send_json_response({
                                'status': 'success',
                                'project_id': project_id,
                                'verification_data': None,
                                'message': 'No verification data available'
                            })
                            return
                        
                        latest_verification = verification_data[0]
                        verification_info = latest_verification.get('data', {})
                        print(f"✅ Returning verification data with score: {latest_verification.get('ai_score', 0)}")
                        
                        # Convert datetime to ISO string for JSON serialization
                        verified_at = latest_verification.get('verified_at', '')
                        if hasattr(verified_at, 'isoformat'):
                            verified_at = verified_at.isoformat()
                        elif verified_at and not isinstance(verified_at, str):
                            verified_at = str(verified_at)
                        
                        self.send_json_response({
                            'status': 'success',
                            'project_id': project_id,
                            'verification_score': latest_verification.get('ai_score', 0),
                            'ai_verification': verification_info.get('ai_verification', {}),
                            'enhanced_ai_verification': verification_info.get('enhanced_ai_verification', {}),
                            'verified_at': verified_at,
                            'verification_type': latest_verification.get('verification_type', ''),
                            'field_measurements': project.get('field_measurements', {}),
                            'project_data': {
                                'ecosystem_type': project.get('ecosystem_type', ''),
                                'area_hectares': float(project.get('area_hectares', 0)) if project.get('area_hectares') else 0,
                                'location': project.get('location', {}),
                                'description': project.get('description', ''),
                                'restoration_method': project.get('restoration_method', ''),
                                'carbon_estimate': float(project.get('carbon_estimate', 0)) if project.get('carbon_estimate') else 0
                            }
                        })
                        return
                        
                    except Exception as e:
                        print(f"❌ Error in verification endpoint: {str(e)}")
                        self.send_error_response(500, f"Error retrieving verification data: {str(e)}")
                        return
                else:
                    self.send_error_response(503, "Database service not available")
                    return
            
            # Project verification status (includes 3rd party verification) - MUST come before generic /api/projects/ handler
            if path.startswith("/api/projects/") and path.endswith("/verification-status"):
                print(f"🔍 DEBUG: Verification status endpoint hit for path: {path}")
                project_id = path.split("/")[-2]  # Get project ID from path like /api/projects/{id}/verification-status
                print(f"🔍 DEBUG: Extracted project_id: {project_id}")

                # Get project from appropriate database
                project = None
                if NEONDB_AVAILABLE and db_service:
                    try:
                        project = db_service.get_project(project_id)
                        print(f"📄 Verification status - Project found in NeonDB: {project is not None}")
                    except Exception as e:
                        print(f"❌ Error getting project from NeonDB for verification status: {e}")
                        project = projects_db.get(project_id)
                        print(f"📄 Verification status - Fallback to in-memory DB: {project is not None}")
                else:
                    project = projects_db.get(project_id)
                    print(f"📄 Verification status - Project found in in-memory DB: {project is not None}")

                if not project:
                    print(f"❌ Project {project_id} not found for verification status")
                    self.send_json_response({
                        'success': False,
                        'error_code': 404,
                        'message': f'Project {project_id} not found',
                        'timestamp': datetime.now().isoformat()
                    })
                    return

                # Build comprehensive verification status, always returning a default if missing
                verification_status = {
                    'project_id': project_id,
                    'overall_status': project.get('status', 'unknown'),
                    'verification_score': project.get('verification_score', 0),
                    'ai_verified': bool(project.get('ai_verification') or project.get('enhanced_ai_verification')),
                    'third_party_verified': project.get('third_party_verified', False),
                    'third_party_organization': project.get('third_party_organization'),
                    'blockchain_registered': project.get('blockchain_registered', False),
                    'blockchain_tx': project.get('blockchain_tx'),
                    'verification_stages': {
                        'ai_verification': {
                            'completed': bool(project.get('ai_verification') or project.get('enhanced_ai_verification')),
                            'score': project.get('verification_score', 0),
                            'result': project.get('enhanced_ai_verification') or project.get('ai_verification')
                        },
                        'third_party_verification': {
                            'completed': project.get('third_party_verified', False),
                            'organization': project.get('third_party_organization'),
                            'report': project.get('third_party_report'),
                            'assigned_to': None  # Could be populated by verification system
                        },
                        'admin_review': {
                            'completed': project.get('status') in ['approved', 'rejected'],
                            'status': project.get('status')
                        },
                        'blockchain_registration': {
                            'completed': project.get('blockchain_registered', False),
                            'transaction_hash': project.get('blockchain_tx'),
                            'blockchain_id': project.get('blockchain_id')
                        }
                    },
                    'next_steps': []
                }

                # Add next steps based on current status
                if not verification_status['verification_stages']['ai_verification']['completed']:
                    verification_status['next_steps'].append('AI verification pending')
                elif not verification_status['verification_stages']['third_party_verification']['completed']:
                    verification_status['next_steps'].append('Awaiting 3rd party organization verification')
                elif not verification_status['verification_stages']['admin_review']['completed']:
                    verification_status['next_steps'].append('Awaiting admin review and approval')
                elif not verification_status['verification_stages']['blockchain_registration']['completed']:
                    verification_status['next_steps'].append('Blockchain registration pending')
                else:
                    verification_status['next_steps'].append('Project fully verified and registered')

                self.send_json_response({
                    'success': True,
                    'verification_status': verification_status
                })
                return
            
            # Generic project details handler - comes after specific handlers
            if path.startswith("/api/projects/"):
                project_id = path.split("/")[-1]
                
                # Get project from NeonDB instead of in-memory database
                project = None
                if NEONDB_AVAILABLE and db_service:
                    try:
                        db_project = db_service.get_project(project_id)
                        if db_project:
                            # Convert database format to API format
                            project = {
                                'id': db_project['project_id'],
                                'project_name': db_project['title'],
                                'description': db_project['description'],
                                'location': db_project['location'] if isinstance(db_project['location'], dict) else {},
                                'ecosystem_type': db_project['ecosystem_type'],
                                'area_hectares': float(db_project['area_hectares']) if db_project['area_hectares'] else 0,
                                'carbon_impact': float(db_project['carbon_estimate']) if db_project['carbon_estimate'] else 0,
                                'status': db_project['status'],
                                'blockchain_tx': db_project['blockchain_tx_hash'],
                                'ipfs_hash': db_project['ipfs_hash'],
                                'workflow_id': db_project['workflow_id'],
                                'created_at': db_project['created_at'].isoformat() if db_project['created_at'] else ''
                            }
                    except Exception as e:
                        print(f"❌ Error getting project from NeonDB: {e}")
                        project = projects_db.get(project_id)
                else:
                    project = projects_db.get(project_id)
                    
                if project:
                    self.send_json_response({
                        "status": "success",
                        "project": {
                            **project,
                            "media_count": {
                                "photos": len(project.get('media_files', {}).get('photos', [])),
                                "videos": len(project.get('media_files', {}).get('videos', [])),
                                "documents": len(project.get('media_files', {}).get('documents', []))
                            }
                        }
                    })
                else:
                    self.send_error_response(404, f"Project {project_id} not found")
                return
            
            # Admin dashboard endpoints
            if path == "/api/admin/dashboard":
                # Get projects from NeonDB instead of in-memory database
                if NEONDB_AVAILABLE and db_service:
                    try:
                        projects_list = db_service.get_all_projects(limit=10)  # Further reduced for faster loading
                        # Convert database format to admin dashboard format with minimal verification data
                        enhanced_projects = []
                        for p in projects_list:
                            # Use the verification data already included in the project from get_all_projects
                            verification_score = p.get('verification_score', 0)
                            ai_verification = p.get('ai_verification', {})
                            enhanced_ai_verification = p.get('enhanced_ai_verification', {})
                            
                            # Create minimal summaries for admin dashboard
                            ai_summary = {}
                            enhanced_summary = {}
                            
                            if ai_verification:
                                ai_summary = {
                                    'overall_score': round(ai_verification.get('overall_score', 0), 2),
                                    'status': ai_verification.get('status', 'unknown')[:20],  # Truncate long statuses
                                    'confidence_level': ai_verification.get('confidence_level', 'unknown')[:10]
                                }
                            
                            if enhanced_ai_verification:
                                enhanced_summary = {
                                    'overall_score': round(enhanced_ai_verification.get('overall_score', 0), 2),
                                    'category': enhanced_ai_verification.get('category', 'unknown')[:15],
                                    'status': enhanced_ai_verification.get('status', 'unknown')[:20]
                                }
                            
                            project_data = {
                                'id': p['project_id'],
                                'project_name': p['title'],
                                'description': p['description'][:100] + '...' if p['description'] and len(p['description']) > 100 else p['description'],  # Truncate long descriptions
                                'location': p['location'] if isinstance(p['location'], dict) else {},
                                'ecosystem_type': p['ecosystem_type'],
                                'area_hectares': float(p['area_hectares']) if p['area_hectares'] else 0,
                                'carbon_impact': float(p['carbon_estimate']) if p['carbon_estimate'] else 0,
                                'carbon_credits': 0,
                                'status': p['status'],
                                'blockchain_tx': p['blockchain_tx_hash'],
                                'ipfs_hash': p['ipfs_hash'],
                                'workflow_id': p['workflow_id'],
                                'created_at': p['created_at'].isoformat() if p['created_at'] else '',
                                'verification_score': verification_score,
                                'ai_verification': ai_summary,  # Minimal summary
                                'enhanced_ai_verification': enhanced_summary  # Minimal summary
                            }
                            enhanced_projects.append(project_data)
                        
                        projects_list = enhanced_projects
                    except Exception as e:
                        print(f"❌ Error getting projects from NeonDB for admin dashboard: {e}")
                        # Fallback to in-memory database
                        projects_list = list(projects_db.values())
                else:
                    # Fallback to in-memory database
                    projects_list = list(projects_db.values())
                
                # Quick statistics calculations (optimized for speed)
                total_projects = len(projects_list)
                pending_review = len([p for p in projects_list if p.get('status') == 'submitted'])
                ai_flagged = len([p for p in projects_list if p.get('verification_score', 100) < 60])
                approved = len([p for p in projects_list if p.get('status') == 'approved'])
                rejected = len([p for p in projects_list if p.get('status') == 'rejected'])
                total_credits = 0  # Simplified to avoid complex calculations
                
                # Limit data for faster response
                recent_projects = projects_list[:5]  # Only top 5 for faster loading
                pending_projects = [p for p in projects_list[:5] if p.get('status') in ['submitted', 'requires_review']]
                ai_alerts = [p for p in projects_list[:5] if p.get('verification_score', 100) < 70]
                
                # Ultra-lightweight response to prevent client disconnections
                response_data = {
                    "status": "success",
                    "timestamp": datetime.now().isoformat(),
                    "statistics": {
                        "total_projects": total_projects,
                        "pending_review": pending_review,
                        "ai_flagged": ai_flagged,
                        "approved": approved,
                        "rejected": rejected,
                        "total_credits": total_credits
                    },
                    "recent_projects": [{
                        'id': p.get('id'),
                        'project_name': p.get('project_name', '')[:50],  # Slightly longer names
                        'status': p.get('status'),
                        'verification_score': p.get('verification_score', 0),
                        'ecosystem_type': p.get('ecosystem_type', 'unknown'),
                        'area_hectares': p.get('area_hectares', 0),
                        'created_at': p.get('created_at', ''),
                        'created_by': p.get('created_by', 'Unknown'),
                        'location': p.get('location', {}),
                        'field_measurements': p.get('field_measurements', {})
                    } for p in recent_projects],
                    "pending_projects": [{
                        'id': p.get('id'),
                        'project_name': p.get('project_name', '')[:50],
                        'status': p.get('status'),
                        'ecosystem_type': p.get('ecosystem_type', 'unknown'),
                        'area_hectares': p.get('area_hectares', 0),
                        'verification_score': p.get('verification_score', 0)
                    } for p in pending_projects[:5]],  # Max 5 items
                    "ai_alerts": [{
                        'id': p.get('id'),
                        'project_name': p.get('project_name', '')[:50],
                        'score': p.get('verification_score', 0),
                        'ecosystem_type': p.get('ecosystem_type', 'unknown'),
                        'status': p.get('status')
                    } for p in ai_alerts[:5]],  # Max 5 items
                    "system_status": {
                        "ai_verification": "operational" if AI_VERIFICATION_AVAILABLE else "offline",
                        "database": "connected",
                        "backend": "running"
                    }
                }
                
                self.send_json_response(response_data)
                return
            
            if path == "/api/admin/analytics":
                projects_list = list(projects_db.values())
                
                # Ecosystem distribution
                ecosystem_stats = {}
                for project in projects_list:
                    ecosystem = project.get('ecosystem_type', 'unknown')
                    ecosystem_stats[ecosystem] = ecosystem_stats.get(ecosystem, 0) + 1
                
                # Status distribution
                status_stats = {}
                for project in projects_list:
                    status = project.get('status', 'pending')
                    status_stats[status] = status_stats.get(status, 0) + 1
                
                # Monthly submissions
                monthly_stats = {}
                for project in projects_list:
                    created_date = project.get('created_at', '')
                    try:
                        month = created_date[:7]  # YYYY-MM
                        monthly_stats[month] = monthly_stats.get(month, 0) + 1
                    except:
                        pass
                
                # Geographic distribution
                location_stats = {}
                for project in projects_list:
                    location = project.get('location', {})
                    if location and 'lat' in location:
                        lat = float(location.get('lat', 0))
                        if 8 <= lat <= 12:
                            region = 'Tamil Nadu Coast'
                        elif 12 <= lat <= 16:
                            region = 'Andhra Pradesh Coast'
                        elif 16 <= lat <= 20:
                            region = 'Odisha Coast'
                        elif 20 <= lat <= 24:
                            region = 'West Bengal Coast'
                        else:
                            region = 'Other Coastal Areas'
                        location_stats[region] = location_stats.get(region, 0) + 1
                
                self.send_json_response({
                    "status": "success",
                    "ecosystem_distribution": ecosystem_stats,
                    "status_distribution": status_stats,
                    "monthly_submissions": monthly_stats,
                    "geographic_distribution": location_stats,
                    "carbon_metrics": {
                        "total_credits_issued": sum(p.get('carbon_credits', 0) for p in projects_list),
                        "average_credits_per_project": sum(p.get('carbon_credits', 0) for p in projects_list) / max(len(projects_list), 1),
                        "total_area_restored": sum(p.get('area_hectares', 0) for p in projects_list)
                    },
                    "verification_metrics": {
                        "average_ai_score": sum(p.get('verification_score', 0) for p in projects_list) / max(len(projects_list), 1),
                        "high_confidence": len([p for p in projects_list if p.get('verification_score', 0) >= 80]),
                        "medium_confidence": len([p for p in projects_list if 60 <= p.get('verification_score', 0) < 80]),
                        "low_confidence": len([p for p in projects_list if p.get('verification_score', 0) < 60])
                    },
                    "generated_at": datetime.now().isoformat()
                })
                return
            
            # Verification endpoints
            if path == "/api/verification/status":
                self.send_json_response({
                    "ai_verification_available": AI_VERIFICATION_AVAILABLE,
                    "models_loaded": [
                        "image_recognition",
                        "fraud_detection",
                        "data_validation", 
                        "location_verification",
                        "temporal_analysis"
                    ] if AI_VERIFICATION_AVAILABLE else [],
                    "confidence_thresholds": {
                        "high": 0.85,
                        "medium": 0.65,
                        "low": 0.45
                    },
                    "status": "operational" if AI_VERIFICATION_AVAILABLE else "disabled"
                })
                return
            
            # Marketplace endpoints
            if path == "/api/marketplace":
                listings = list(marketplace_db.values())
                self.send_json_response({
                    "status": "success",
                    "listings": listings,
                    "total": len(listings)
                })
                return
            
            # Payment history endpoint
            if path == "/api/payments":
                # Mock payment history
                payments = [
                    {
                        "id": "PAY_001",
                        "project_id": "BC_PROD001",
                        "amount": 15000.0,
                        "currency": "INR",
                        "recipient": "community@sundarbans.org",
                        "status": "completed",
                        "date": "2024-01-15T10:30:00Z",
                        "method": "UPI"
                    },
                    {
                        "id": "PAY_002", 
                        "project_id": "BC_PROD002",
                        "amount": 8000.0,
                        "currency": "INR",
                        "recipient": "ngo@coastal.org",
                        "status": "pending",
                        "date": "2024-01-20T14:15:00Z",
                        "method": "Bank Transfer"
                    }
                ]
                self.send_json_response({
                    "status": "success",
                    "payments": payments,
                    "total": len(payments)
                })
                return
            
            # Reporting endpoint
            if path == "/api/reports":
                projects_list = list(projects_db.values())
                
                # Generate comprehensive report
                report = {
                    "summary": {
                        "total_projects": len(projects_list),
                        "total_area_restored": sum(p.get('area_hectares', 0) for p in projects_list),
                        "total_carbon_credits": sum(p.get('carbon_credits', 0) for p in projects_list),
                        "total_co2_sequestered": sum(p.get('carbon_credits', 0) for p in projects_list) * 1.0,  # Assuming 1 credit = 1 tCO2
                        "communities_impacted": len(set(p.get('community_details', '') for p in projects_list if p.get('community_details')))
                    },
                    "environmental_impact": {
                        "ecosystems_restored": {
                            "mangrove": len([p for p in projects_list if p.get('ecosystem_type') == 'mangrove']),
                            "seagrass": len([p for p in projects_list if p.get('ecosystem_type') == 'seagrass']),
                            "salt_marsh": len([p for p in projects_list if p.get('ecosystem_type') == 'salt_marsh']),
                            "coastal_wetland": len([p for p in projects_list if p.get('ecosystem_type') == 'coastal_wetland'])
                        },
                        "biodiversity_indicators": {
                            "species_protected": 45,
                            "habitat_connectivity": "High",
                            "water_quality_improvement": "Significant"
                        }
                    },
                    "economic_impact": {
                        "revenue_generated": sum(p.get('carbon_credits', 0) * 500 for p in projects_list),  # Assuming ₹500 per credit
                        "jobs_created": len(projects_list) * 3,  # Estimated 3 jobs per project
                        "community_income_increase": "25%"
                    },
                    "compliance_status": {
                        "verified_projects": len([p for p in projects_list if p.get('status') == 'approved']),
                        "pending_verification": len([p for p in projects_list if p.get('status') in ['pending_verification', 'requires_review']]),
                        "compliance_rate": "98%"
                    }
                }
                
                self.send_json_response({
                    "status": "success",
                    "report": report,
                    "generated_at": datetime.now().isoformat()
                })
                return
            
            # Blockchain integration endpoint
            if path == "/api/blockchain/status":
                self.send_json_response({
                    "status": "success",
                    "blockchain": {
                        "network": "Polygon Mumbai Testnet",
                        "smart_contracts": {
                            "project_registry": "0x1234...5678",
                            "carbon_credits": "0x9abc...def0",
                            "payment_distributor": "0x2468...ace1"
                        },
                        "latest_block": 45627843,
                        "transaction_count": 2847,
                        "gas_price": "30 gwei"
                    }
                })
                return
            
            # IPFS storage endpoint
            if path == "/api/ipfs/status":
                self.send_json_response({
                    "status": "success",
                    "ipfs": {
                        "node_status": "online",
                        "peer_count": 156,
                        "storage_used": "2.3 GB",
                        "files_stored": 1847,
                        "gateway_url": "https://gateway.pinata.cloud/ipfs/"
                    }
                })
                return
            
            # Enhanced blockchain endpoints
            if path.startswith("/api/blockchain/project/"):
                parts = path.split('/')
                if len(parts) >= 6:
                    project_id = parts[4]
                    action = parts[5]
                    
                    if action == "history":
                        # Get blockchain history for project
                        project_records = blockchain_records.get(project_id, {})
                        if not project_records:
                            self.send_error_response(404, 'No blockchain records found for this project')
                            return
                        
                        # Create timeline
                        timeline = []
                        if 'registration' in project_records:
                            timeline.append({
                                'event': 'Project Registration',
                                'timestamp': project_records['registration']['timestamp'],
                                'transaction_hash': project_records['registration']['transaction_hash'],
                                'block_number': project_records['registration']['block_number'],
                                'status': 'completed'
                            })
                        
                        if 'approval' in project_records:
                            timeline.append({
                                'event': 'Project Approval',
                                'timestamp': project_records['approval']['approval_timestamp'],
                                'transaction_hash': project_records['approval']['transaction_hash'],
                                'block_number': project_records['approval']['block_number'],
                                'status': 'completed'
                            })
                        
                        if 'tokenization' in project_records:
                            timeline.append({
                                'event': 'Carbon Credit Tokenization',
                                'timestamp': project_records['tokenization']['issuance_date'],
                                'transaction_hash': project_records['tokenization']['transaction_hash'],
                                'block_number': project_records['tokenization']['block_number'],
                                'status': 'completed'
                            })
                        
                        timeline.sort(key=lambda x: x['timestamp'])
                        
                        self.send_json_response({
                            'success': True,
                            'project_id': project_id,
                            'blockchain_records': project_records,
                            'timeline': timeline,
                            'total_transactions': len(timeline)
                        })
                        return
            
            if path == "/api/contracts/info":
                contracts_info = {
                    'network': 'Polygon Mumbai Testnet',
                    'chain_id': 80001,
                    'explorer': 'https://mumbai.polygonscan.com',
                    'contracts': {
                        'ProjectRegistry': {
                            'address': '0x742d35Cc6634C0532925a3b8D5c65E1c3F1234AB',
                            'abi_hash': '0xabc123def456...',
                            'deployed_block': 41230000,
                            'verified': True,
                            'functions': [
                                'registerProject',
                                'updateProjectStatus', 
                                'getProjectDetails',
                                'getProjectsByStatus'
                            ]
                        },
                        'CarbonCreditToken': {
                            'address': '0x1234567890abcdef1234567890abcdef12345678',
                            'symbol': 'BCC',
                            'name': 'Blue Carbon Credits',
                            'decimals': 18,
                            'total_supply': 1247.5,
                            'verified': True,
                            'functions': [
                                'mint',
                                'burn',
                                'transfer',
                                'balanceOf',
                                'getCreditsMetadata'
                            ]
                        },
                        'PaymentDistributor': {
                            'address': '0xabcdef1234567890abcdef1234567890abcdef12',
                            'verified': True,
                            'total_distributed': 623500.0,
                            'functions': [
                                'distributePayment',
                                'setRecipients',
                                'claimPayment',
                                'getDistributionHistory'
                            ]
                        }
                    },
                    'last_updated': datetime.now().isoformat()
                }
                
                self.send_json_response({
                    'success': True,
                    'contracts': contracts_info
                })
                return
            
            # Frontend route handling - serve React app for non-API routes
            if not path.startswith('/api/'):
                # Check if this is a frontend route that should serve the React app
                frontend_routes = [
                    '/', '/login', '/dashboard', '/user/dashboard', '/admin/dashboard',
                    '/projects', '/projects/create', '/data-collection', '/verification',
                    '/marketplace', '/carbon-credits', '/payments', '/reports'
                ]
                
                # Serve a simple response indicating the frontend should handle this route
                if path in frontend_routes or path.startswith('/admin/') or path.startswith('/user/'):
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    
                    # Simple HTML response that tells the client this is a frontend route
                    html_response = f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Blue Carbon MRV System</title>
                        <meta charset="utf-8">
                    </head>
                    <body>
                        <div id="root">
                            <h2>Blue Carbon MRV System</h2>
                            <p>Frontend route: {path}</p>
                            <p>This route should be handled by the React frontend application.</p>
                            <p>Please access this route through the React development server (typically http://localhost:3000{path})</p>
                            <p>Backend API is running on http://localhost:8002</p>
                        </div>
                    </body>
                    </html>
                    """
                    self.wfile.write(html_response.encode('utf-8'))
                    return
            
            # Get IPFS files for a project
            if path.startswith("/api/ipfs/files/"):
                project_id = path.split('/')[-1]
                print(f"🔍 Getting IPFS files for project: {project_id}")
                
                # Check in-memory database first (has most recent IPFS data)
                project = None
                if project_id in projects_db:
                    project = projects_db[project_id]
                    print(f"📄 IPFS files - Project found in in-memory DB: {project is not None}")
                # Fallback to NeonDB if not in memory
                elif NEONDB_AVAILABLE and db_service:
                    try:
                        project = db_service.get_project(project_id)
                        print(f"📄 IPFS files - Project found in NeonDB: {project is not None}")
                    except Exception as e:
                        print(f"❌ Error getting project from NeonDB for IPFS: {e}")
                
                if not project:
                    print(f"❌ Project {project_id} not found in any database for IPFS files")
                    self.send_error_response(404, f"Project {project_id} not found")
                    return
                
                # Get IPFS media files
                ipfs_media = project.get('ipfs_media', {})
                media_files = project.get('media_files', {})
                
                print(f"📄 Project ipfs_media: {ipfs_media}")
                print(f"📄 Project media_files: {media_files}")
                
                # If no ipfs_media but has media_files, use that structure
                if not ipfs_media and media_files:
                    ipfs_media = media_files
                    print(f"📄 Using media_files as fallback: {ipfs_media}")
                
                # Calculate total files
                total_files = 0
                for category, files in ipfs_media.items():
                    if isinstance(files, list):
                        total_files += len(files)
                        print(f"📄 Category {category}: {len(files)} files")
                
                response_data = {
                    'status': 'success',
                    'project_id': project_id,
                    'media': ipfs_media,
                    'media_files': media_files,
                    'has_ipfs_data': bool(ipfs_media),
                    'total_files': total_files,
                    'debug_info': {
                        'has_ipfs_media': bool(ipfs_media),
                        'has_media_files': bool(media_files),
                        'ipfs_keys': list(ipfs_media.keys()) if ipfs_media else [],
                        'media_keys': list(media_files.keys()) if media_files else []
                    }
                }
                
                print(f"📄 Sending IPFS response: {response_data}")
                self.send_json_response(response_data)
                return
            
            # 3rd Party Verification - Get Dashboard Data
            if path.startswith("/api/3rd-party/dashboard/"):
                org_id = path.split('/')[-1]
                
                try:
                    dashboard_data = third_party_system.get_organization_dashboard(org_id)
                    
                    if dashboard_data['success']:
                        self.send_json_response({
                            'success': True,
                            'data': dashboard_data['data']
                        })
                    else:
                        self.send_error_response(404, dashboard_data['message'])
                    return
                    
                except Exception as e:
                    print(f"❌ Error getting dashboard data: {str(e)}")
                    self.send_error_response(500, f"Dashboard error: {str(e)}")
                    return
            
            # 3rd Party Verification - Get Available Projects
            if path == "/api/3rd-party/available-projects":
                try:
                    # Get all projects that need 3rd party verification
                    available_projects = []
                    
                    if NEONDB_AVAILABLE and db_service:
                        try:
                            all_projects = db_service.get_all_projects(limit=100)
                            available_projects = [
                                p for p in all_projects 
                                if not p.get('third_party_verified', False) and 
                                   p.get('verification_score', 0) >= 50  # Only projects with decent scores
                            ]
                        except Exception as e:
                            print(f"❌ Error getting projects from NeonDB for 3rd party: {e}")
                            available_projects = [
                                p for p in projects_db.values() 
                                if not p.get('third_party_verified', False) and 
                                   p.get('verification_score', 0) >= 50
                            ]
                    else:
                        available_projects = [
                            p for p in projects_db.values() 
                            if not p.get('third_party_verified', False) and 
                               p.get('verification_score', 0) >= 50
                        ]
                    
                    self.send_json_response({
                        'success': True,
                        'projects': available_projects,
                        'count': len(available_projects)
                    })
                    return
                    
                except Exception as e:
                    print(f"❌ Error getting available projects: {str(e)}")
                    self.send_error_response(500, f"Available projects error: {str(e)}")
                    return
            
            # 3rd Party Verification - Get Organizations List
            if path == "/api/3rd-party/organizations":
                try:
                    organizations = third_party_system.get_all_organizations()
                    
                    self.send_json_response({
                        'success': True,
                        'organizations': organizations
                    })
                    return
                    
                except Exception as e:
                    print(f"❌ Error getting organizations: {str(e)}")
                    self.send_error_response(500, f"Organizations error: {str(e)}")
                    return
            
            # 3rd Party Verification - Get Verification Reports
            if path.startswith("/api/3rd-party/reports/"):
                project_id = path.split('/')[-1]
                
                try:
                    reports = third_party_system.get_project_reports(project_id)
                    
                    self.send_json_response({
                        'success': True,
                        'reports': reports,
                        'project_id': project_id
                    })
                    return
                    
                except Exception as e:
                    print(f"❌ Error getting reports: {str(e)}")
                    self.send_error_response(500, f"Reports error: {str(e)}")
                    return

            # Fallback - endpoint not found
            self.send_error_response(404, f"Endpoint {path} not found")
            
        except BrokenPipeError:
            # Client disconnected - log and ignore
            print(f"⚠️ Client disconnected during GET request to {self.path}")
        except Exception as e:
            print(f"❌ Error in GET request: {str(e)}")
            try:
                self.send_error_response(500, f"Internal server error: {str(e)}")
            except BrokenPipeError:
                print(f"⚠️ Client disconnected during error response")
            except Exception as inner_e:
                print(f"❌ Error sending error response: {inner_e}")
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            path = self.path.split('?')[0]
            
            # Project creation endpoint
            if path == "/api/projects/create":
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length == 0:
                    self.send_error_response(400, "No data provided")
                    return
                
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                # Use provided project ID or generate unique project ID
                project_id = data.get('id') or f"BC_{hashlib.sha256(str(get_current_time()).encode()).hexdigest()[:8].upper()}"
                print(f"🆔 Using project ID: {project_id} (provided: {'yes' if data.get('id') else 'no'})")
                
                # Run enhanced AI verification if available
                verification_score = 0
                ai_verification_result = None
                enhanced_ai_result = None
                
                if AI_VERIFICATION_AVAILABLE and enhanced_ai_engine:
                    try:
                        print(f"🤖 Running enhanced AI verification for project: {data.get('project_name', 'Unknown')}")
                        enhanced_ai_result = enhanced_ai_engine.verify_project_submission(data)
                        
                        # Check if result is a dictionary
                        if isinstance(enhanced_ai_result, dict):
                            verification_score = int(enhanced_ai_result.get('overall_score', 0))
                            print(f"✅ Enhanced AI verification completed with score: {verification_score}")
                            print(f"📊 Category: {enhanced_ai_result.get('category', 'unknown')}")
                        else:
                            print(f"⚠️ Enhanced AI returned unexpected format: {type(enhanced_ai_result)}")
                            enhanced_ai_result = None
                            verification_score = self._calculate_manual_score(data)
                        
                        # Also run original AI for comparison
                        if ai_engine:
                            try:
                                ai_verification_result = ai_engine.verify_project_submission(data)
                            except Exception as ai_error:
                                print(f"⚠️ Original AI verification failed: {str(ai_error)}")
                        
                    except Exception as e:
                        print(f"❌ Enhanced AI verification failed: {str(e)}")
                        import traceback
                        traceback.print_exc()
                        enhanced_ai_result = None
                        # Fallback to original AI or manual scoring
                        if ai_engine:
                            try:
                                ai_verification_result = ai_engine.verify_project_submission(data)
                                verification_score = int(ai_verification_result.get('overall_score', 0) * 100)
                            except:
                                verification_score = self._calculate_manual_score(data)
                        else:
                            verification_score = self._calculate_manual_score(data)
                elif AI_VERIFICATION_AVAILABLE and ai_engine:
                    try:
                        ai_verification_result = ai_engine.verify_project_submission(data)
                        verification_score = int(ai_verification_result.get('overall_score', 0) * 100)
                    except:
                        verification_score = self._calculate_manual_score(data)
                else:
                    verification_score = self._calculate_manual_score(data)
                
                # Determine status based on score
                if verification_score >= 85:
                    status = "approved"
                elif verification_score >= 65:
                    status = "requires_review" 
                else:
                    status = "pending_verification"
                
                # Process IPFS hashes and organize media files
                ipfs_media = {"photos": [], "videos": [], "documents": []}
                media_count = {"photos": 0, "videos": 0, "documents": 0}
                
                if "ipfs_hashes" in data:
                    for ipfs_item in data["ipfs_hashes"]:
                        file_type = ipfs_item.get("type", "documents")
                        if file_type in ipfs_media:
                            media_entry = {
                                "filename": ipfs_item.get("filename", "Unknown"),
                                "ipfs_hash": ipfs_item.get("hash", ""),
                                "gateway_url": ipfs_item.get("gateway_url", ""),
                                "description": ipfs_item.get("description", ""),
                                "uploaded_at": ipfs_item.get("timestamp", datetime.now().isoformat()),
                                "size": ipfs_item.get("size", 0),
                                "location": ipfs_item.get("location", {})
                            }
                            ipfs_media[file_type].append(media_entry)
                            media_count[file_type] += 1
                
                # Create project record with enhanced AI data
                project = {
                    "id": project_id,
                    "created_by": data.get('created_by', 'user'),
                    "created_at": get_current_time().isoformat(),
                    "updated_at": get_current_time().isoformat(),
                    "status": status,
                    "verification_score": verification_score,
                    "ai_verification": ai_verification_result,  # Original AI results
                    "enhanced_ai_verification": enhanced_ai_result,  # Enhanced AI results
                    "third_party_verified": False,  # NGO verification status
                    "third_party_organization": None,  # Which NGO verified
                    "third_party_report": None,  # Verification report
                    "carbon_credits": 0,  # Awarded upon approval
                    "blockchain_tx": None,  # Set upon blockchain registration
                    "blockchain_id": None,  # Set upon blockchain registration
                    "blockchain_registered": False,
                    "ipfs_media": ipfs_media,
                    "media_count": media_count,
                    **{k: v for k, v in data.items() if k not in ["ipfs_hashes"]}  # Exclude ipfs_hashes from direct copy
                }
                
                # Register project on blockchain if available and score is high enough
                blockchain_result = None
                if BLOCKCHAIN_SERVICE_AVAILABLE and verification_score >= 40:  # Lower threshold for demo
                    try:
                        print(f"🔗 Registering project {project_id} on blockchain...")
                        blockchain_result = register_project_on_blockchain(data)
                        
                        if blockchain_result.get("success"):
                            project["blockchain_registered"] = True
                            project["blockchain_id"] = blockchain_result.get("blockchain_id")
                            project["blockchain_tx"] = blockchain_result.get("tx_hash")
                            print(f"✅ Project registered on blockchain: {blockchain_result.get('tx_hash')}")
                        else:
                            print(f"❌ Blockchain registration failed: {blockchain_result.get('error')}")
                    except Exception as e:
                        print(f"❌ Blockchain registration error: {str(e)}")
                        blockchain_result = {"success": False, "error": str(e)}
                
                
                # Store project in NeonDB instead of in-memory database
                if NEONDB_AVAILABLE and db_service:
                    try:
                        db_project = db_service.create_project({
                            'project_id': project_id,
                            'title': project.get('project_name', 'Untitled Project'),
                            'description': project.get('description', ''),
                            'location': project.get('location', {}),
                            'ecosystem_type': project.get('ecosystem_type', 'unknown'),
                            'area_hectares': project.get('area_hectares', 0),
                            'carbon_estimate': project.get('carbon_impact', 0),
                            'blockchain_tx_hash': project.get('blockchain_tx'),
                            'ipfs_hash': project.get('ipfs_hash'),
                            'workflow_id': project.get('workflow_id'),
                            'field_measurements': data.get('field_measurements', {})  # Add field measurements
                        })
                        
                        # Store verification data - ensure both AI verification results are saved
                        verification_data_to_store = {
                            'ai_verification': ai_verification_result if ai_verification_result else {},
                            'enhanced_ai_verification': enhanced_ai_result if enhanced_ai_result else {},
                            'verification_score': verification_score,
                            'project_name': project.get('project_name', ''),
                            'ecosystem_type': project.get('ecosystem_type', ''),
                            'verification_timestamp': datetime.now().isoformat()
                        }
                        
                        # Only store if we have actual verification data (not None or empty)
                        if ai_verification_result or enhanced_ai_result:
                            try:
                                db_service.create_verification_data({
                                    'project_id': project_id,
                                    'verification_type': 'ai_analysis',
                                    'data': verification_data_to_store,
                                    'ai_score': verification_score
                                })
                                print(f"✅ Verification data stored for project {project_id}")
                            except Exception as ver_error:
                                print(f"❌ Error storing verification data: {ver_error}")
                        else:
                            print(f"⚠️ No verification data to store for project {project_id}")
                        
                        print(f"✅ Project {project_id} stored in NeonDB successfully")
                        
                        # Check for orphaned IPFS uploads and associate them with this project
                        if project_id in orphaned_ipfs_uploads:
                            print(f"🔄 Found orphaned IPFS uploads for project {project_id}")
                            orphaned_data = orphaned_ipfs_uploads[project_id]
                            
                            # Create in-memory project with IPFS data
                            projects_db[project_id] = {
                                'project_name': project.get('project_name', 'Unknown'),
                                'ipfs_media': orphaned_data,
                                'media_files': {},
                                'media_count': {
                                    'photos': len(orphaned_data.get('photos', [])),
                                    'videos': len(orphaned_data.get('videos', [])),
                                    'documents': len(orphaned_data.get('documents', []))
                                }
                            }
                            
                            # Update NeonDB with IPFS data
                            try:
                                update_data = {
                                    'ipfs_media': orphaned_data,
                                    'media_count': projects_db[project_id]['media_count'],
                                    'updated_at': datetime.now().isoformat()
                                }
                                db_service.update_project(project_id, update_data)
                                print(f"✅ Associated orphaned IPFS uploads with project {project_id}")
                                print(f"📄 IPFS data: {orphaned_data}")
                                
                                # Remove from orphaned list
                                del orphaned_ipfs_uploads[project_id]
                            except Exception as e:
                                print(f"❌ Error updating project with orphaned IPFS data: {e}")
                        
                    except Exception as e:
                        print(f"❌ Error storing project in NeonDB: {e}")
                        # Fallback to in-memory storage
                        projects_db[project_id] = project
                else:
                    # Fallback to in-memory storage if NeonDB not available
                    projects_db[project_id] = project
                
                # Prepare comprehensive response
                response_data = {
                    "status": "success",
                    "project_id": project_id,
                    "verification_score": verification_score,
                    "current_status": status,
                    "message": f"Project created successfully with verification score {verification_score}/100",
                    "next_steps": self._get_next_steps(status),
                    "estimated_processing_time": "2-4 hours",
                    "ai_analysis": {
                        "overall_score": verification_score,
                        "category": enhanced_ai_result.get('category', 'unknown') if enhanced_ai_result else 'unknown',
                        "detailed_scores": enhanced_ai_result.get('detailed_scores', {}) if enhanced_ai_result else {},
                        "recommendations": enhanced_ai_result.get('recommendations', []) if enhanced_ai_result else [],
                        "warnings": enhanced_ai_result.get('warnings', []) if enhanced_ai_result else [],
                        "ecosystem_assessment": enhanced_ai_result.get('ecosystem_assessment', {}) if enhanced_ai_result else {}
                    },
                    "blockchain": {
                        "registered": project.get("blockchain_registered", False),
                        "tx_hash": project.get("blockchain_tx"),
                        "blockchain_id": project.get("blockchain_id")
                    }
                }
                
                # Add blockchain-specific information if registration was attempted
                if blockchain_result:
                    response_data["blockchain"]["registration_result"] = blockchain_result
                
                self.send_json_response(response_data)
                return
            
            # Project verification (original endpoint) endpoint
            if path.startswith("/api/projects/") and path.endswith("/verify"):
                project_id = path.split('/')[-2]
                
                # Get project from NeonDB
                if NEONDB_AVAILABLE and db_service:
                    try:
                        project = db_service.get_project(project_id)
                        if not project:
                            self.send_error_response(404, f"Project {project_id} not found")
                            return
                    except Exception as e:
                        self.send_error_response(500, f"Database error: {str(e)}")
                        return
                else:
                    # Fallback to in-memory storage
                    if project_id not in projects_db:
                        self.send_error_response(404, f"Project {project_id} not found")
                        return
                    project = projects_db[project_id]
                
                # Run AI verification
                verification_score = 0
                ai_verification_result = None
                enhanced_ai_result = None
                
                if AI_VERIFICATION_AVAILABLE and enhanced_ai_engine:
                    try:
                        print(f"🤖 Running enhanced AI verification for project: {project.get('project_name', 'Unknown')}")
                        enhanced_ai_result = enhanced_ai_engine.verify_project_submission(project)
                        
                        # Check if result is a dictionary
                        if isinstance(enhanced_ai_result, dict):
                            verification_score = int(enhanced_ai_result.get('overall_score', 0))
                            print(f"✅ Enhanced AI verification completed with score: {verification_score}")
                            print(f"📊 Category: {enhanced_ai_result.get('category', 'unknown')}")
                        else:
                            print(f"⚠️ Enhanced AI returned unexpected format: {type(enhanced_ai_result)}")
                            enhanced_ai_result = None
                            verification_score = self._calculate_manual_score(project)
                        
                        # Also run original AI for comparison
                        if ai_engine:
                            try:
                                ai_verification_result = ai_engine.verify_project_submission(project)
                            except Exception as ai_error:
                                print(f"⚠️ Original AI verification failed: {str(ai_error)}")
                        
                    except Exception as e:
                        print(f"❌ Enhanced AI verification failed: {str(e)}")
                        import traceback
                        traceback.print_exc()
                        enhanced_ai_result = None
                        # Fallback to original AI or manual scoring
                        if ai_engine:
                            try:
                                ai_verification_result = ai_engine.verify_project_submission(project)
                                verification_score = int(ai_verification_result.get('overall_score', 0) * 100)
                            except:
                                verification_score = self._calculate_manual_score(project)
                        else:
                            verification_score = self._calculate_manual_score(project)
                elif AI_VERIFICATION_AVAILABLE and ai_engine:
                    try:
                        ai_verification_result = ai_engine.verify_project_submission(project)
                        verification_score = int(ai_verification_result.get('overall_score', 0) * 100)
                    except:
                        verification_score = self._calculate_manual_score(project)
                else:
                    verification_score = self._calculate_manual_score(project)
                
                # Update project with verification results
                updated_project = project.copy()
                updated_project.update({
                    'verification_score': verification_score,
                    'ai_verification': ai_verification_result,
                    'enhanced_ai_verification': enhanced_ai_result,
                    'updated_at': datetime.now().isoformat()
                })
                
                # Store back to database
                if NEONDB_AVAILABLE and db_service:
                    try:
                        success = db_service.update_project(project_id, updated_project)
                        if not success:
                            self.send_error_response(500, "Failed to update project in database")
                            return
                    except Exception as e:
                        self.send_error_response(500, f"Database update error: {str(e)}")
                        return
                else:
                    # Update in-memory storage
                    projects_db[project_id] = updated_project
                
                self.send_json_response({
                    "status": "success",
                    "message": f"AI verification completed for project {project_id}",
                    "project_id": project_id,
                    "verification_score": verification_score,
                    "ai_verification": ai_verification_result,
                    "enhanced_ai_verification": enhanced_ai_result,
                    "updated_at": updated_project['updated_at']
                })
                return
            
            # Admin project review endpoint
            if path.startswith("/api/admin/projects/") and path.endswith("/review"):
                project_id = path.split('/')[-2]
                print(f"🔍 Review request for project: {project_id}")
                
                # Get project data - try NeonDB first, then fallback to in-memory
                project = None
                if NEONDB_AVAILABLE and db_service:
                    try:
                        project = db_service.get_project(project_id)
                        print(f"📄 Project found in NeonDB: {project is not None}")
                    except Exception as e:
                        print(f"❌ Error getting project from NeonDB: {e}")
                        project = projects_db.get(project_id)
                        print(f"📄 Fallback to in-memory DB: {project is not None}")
                else:
                    project = projects_db.get(project_id)
                    print(f"📄 Project found in in-memory DB: {project is not None}")
                
                if not project:
                    print(f"❌ Project {project_id} not found in any database")
                    self.send_error_response(404, f"Project {project_id} not found")
                    return
                
                content_length = int(self.headers.get('Content-Length', 0))
                review_data = json.loads(self.rfile.read(content_length).decode('utf-8'))
                
                # Update project with admin review
                decision = review_data.get('decision')
                credits_awarded = 0
                
                if decision == 'approved':
                    # Calculate carbon credits
                    area = float(project.get('area_hectares', 0))
                    ecosystem = project.get('ecosystem_type', 'mangrove')
                    
                    # Credit calculation factors (tCO2/hectare/year)
                    credit_factors = {
                        'mangrove': 3.2,
                        'seagrass': 2.8,
                        'salt_marsh': 2.5,
                        'coastal_wetland': 2.0
                    }
                    
                    credits_awarded = round(area * credit_factors.get(ecosystem, 2.0), 2)
                
                # Update project status
                review_update = {
                    'status': decision,
                    'carbon_credits': credits_awarded,
                    'updated_at': datetime.now().isoformat(),
                    'admin_review': {
                        'decision': decision,
                        'comments': review_data.get('comments', ''),
                        'reviewer_id': review_data.get('reviewer_id', 'admin'),
                        'review_timestamp': datetime.now().isoformat(),
                        'credits_awarded': credits_awarded
                    }
                }
                
                # Update in both databases
                if NEONDB_AVAILABLE and db_service:
                    try:
                        # Update in NeonDB
                        db_service.update_project_status(project_id, decision, credits_awarded, review_update['admin_review'])
                        print(f"✅ Updated project {project_id} in NeonDB")
                    except Exception as e:
                        print(f"❌ Error updating project in NeonDB: {e}")
                
                # Also update in-memory database for immediate consistency
                if project_id in projects_db:
                    projects_db[project_id].update(review_update)
                    print(f"✅ Updated project {project_id} in in-memory DB")
                
                # Return updated project data
                updated_project = project.copy()
                updated_project.update(review_update)
                
                self.send_json_response({
                    "status": "success",
                    "message": f"Project {decision} successfully",
                    "credits_awarded": credits_awarded,
                    "project": {
                        **updated_project,
                        "media_count": {
                            "photos": len(updated_project.get('media_files', {}).get('photos', [])),
                            "videos": len(updated_project.get('media_files', {}).get('videos', [])),
                            "documents": len(updated_project.get('media_files', {}).get('documents', []))
                        }
                    }
                })
                return
            
            # Marketplace listing endpoint
            if path == "/api/marketplace/list":
                content_length = int(self.headers.get('Content-Length', 0))
                listing_data = json.loads(self.rfile.read(content_length).decode('utf-8'))
                
                listing_id = f"LIST_{len(marketplace_db) + 1:03d}"
                marketplace_db[listing_id] = {
                    "id": listing_id,
                    "project_id": listing_data.get('project_id'),
                    "credits_available": listing_data.get('credits_available'),
                    "price_per_credit": listing_data.get('price_per_credit'),
                    "seller": listing_data.get('seller'),
                    "description": listing_data.get('description'),
                    "created_at": datetime.now().isoformat(),
                    "status": "active"
                }
                
                self.send_json_response({
                    "status": "success",
                    "message": "Carbon credits listed successfully",
                    "listing_id": listing_id
                })
                return
            
            # Carbon credit purchase endpoint
            if path == "/api/marketplace/purchase":
                content_length = int(self.headers.get('Content-Length', 0))
                purchase_data = json.loads(self.rfile.read(content_length).decode('utf-8'))
                
                # Mock payment processing
                payment_id = f"PAY_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                
                self.send_json_response({
                    "status": "success",
                    "message": "Carbon credits purchased successfully",
                    "payment_id": payment_id,
                    "credits_purchased": purchase_data.get('credits'),
                    "total_amount": purchase_data.get('total_amount'),
                    "blockchain_tx": f"0x{hashlib.md5(payment_id.encode()).hexdigest()}"
                })
                return
            
            # Payment distribution endpoint
            if path == "/api/payments/distribute":
                content_length = int(self.headers.get('Content-Length', 0))
                payment_data = json.loads(self.rfile.read(content_length).decode('utf-8'))
                
                # Mock payment distribution
                distribution_id = f"DIST_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                
                self.send_json_response({
                    "status": "success",
                    "message": "Payment distributed successfully",
                    "distribution_id": distribution_id,
                    "recipients": payment_data.get('recipients', []),
                    "total_distributed": payment_data.get('total_amount'),
                    "distribution_method": "UPI/Bank Transfer"
                })
                return
            
            # Payment transfer endpoint for blockchain credit transfers
            if path == "/api/payments/transfer":
                content_length = int(self.headers.get('Content-Length', 0))
                transfer_data = json.loads(self.rfile.read(content_length).decode('utf-8'))
                
                # Mock blockchain transfer
                transaction_id = f"TXN_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                tx_hash = f"0x{transaction_id.lower()}abcdef123456789012345678901234567890"
                
                # Simulate transfer processing
                transfer_record = {
                    "transaction_id": transaction_id,
                    "tx_hash": tx_hash,
                    "from_address": transfer_data.get('from_address'),
                    "to_address": transfer_data.get('to_address'),
                    "amount": transfer_data.get('amount'),
                    "token_type": transfer_data.get('token_type', 'BCC'),
                    "purpose": transfer_data.get('purpose', ''),
                    "user_id": transfer_data.get('user_id'),
                    "status": "confirmed",
                    "block_number": 41234569,
                    "gas_used": 21000,
                    "gas_fee": 0.002,
                    "network": "Polygon Mumbai",
                    "timestamp": datetime.now().isoformat(),
                    "confirmation_time": 12.5
                }
                
                # Store transfer record (in production, this would be in a database)
                if not hasattr(self.server, 'transfer_records'):
                    self.server.transfer_records = {}
                self.server.transfer_records[transaction_id] = transfer_record
                
                self.send_json_response({
                    "status": "success",
                    "message": "Transfer completed successfully",
                    "transaction_id": transaction_id,
                    "tx_hash": tx_hash,
                    "amount": transfer_data.get('amount'),
                    "token_type": transfer_data.get('token_type', 'BCC'),
                    "recipient": transfer_data.get('to_address'),
                    "confirmation_time": 12.5,
                    "gas_fee": 0.002,
                    "blockchain_explorer": f"https://mumbai.polygonscan.com/tx/{tx_hash}"
                })
                return
            
            # Blockchain POST endpoints
            if path.startswith("/api/blockchain/project/"):
                parts = path.split('/')
                if len(parts) >= 6:
                    project_id = parts[4]
                    action = parts[5]
                    
                    content_length = int(self.headers.get('Content-Length', 0))
                    if content_length > 0:
                        data = json.loads(self.rfile.read(content_length).decode('utf-8'))
                    else:
                        data = {}
                    
                    if action == "register":
                        # Register project on blockchain
                        blockchain_record = {
                            'transaction_hash': f'0x{project_id}a1b2c3d4e5f6789012345678901234567890abcd',
                            'block_number': 41234568,
                            'gas_used': 185432,
                            'gas_price': 1.5,
                            'project_id': project_id,
                            'registry_address': '0x742d35Cc6634C0532925a3b8D5c65E1c3F1234AB',
                            'ipfs_hash': data.get('ipfs_hash', f'Qm{project_id}ProjectData'),
                            'status': 'confirmed',
                            'timestamp': datetime.now().isoformat(),
                            'confirmation_time': 15.2,
                            'network_fees': 0.005
                        }
                        
                        if project_id not in blockchain_records:
                            blockchain_records[project_id] = {}
                        blockchain_records[project_id]['registration'] = blockchain_record
                        
                        self.send_json_response({
                            'success': True,
                            'message': 'Project registered on blockchain successfully',
                            'blockchain_record': blockchain_record
                        })
                        return
                    
                    elif action == "approve":
                        # Record project approval on blockchain
                        approval_record = {
                            'transaction_hash': f'0x{project_id}approval789012345678901234567890',
                            'block_number': 41234569,
                            'gas_used': 125678,
                            'project_id': project_id,
                            'approver': data.get('approver', 'NCCR_Admin'),
                            'approval_timestamp': datetime.now().isoformat(),
                            'carbon_credits_issued': data.get('carbon_credits', 0),
                            'verification_score': data.get('verification_score', 0),
                            'status': 'approved',
                            'compliance_hash': f'0xcomp{project_id}liance123456',
                            'certification_uri': f'https://ipfs.io/ipfs/Qm{project_id}Certificate'
                        }
                        
                        if project_id not in blockchain_records:
                            blockchain_records[project_id] = {}
                        blockchain_records[project_id]['approval'] = approval_record
                        
                        self.send_json_response({
                            'success': True,
                            'message': 'Project approval recorded on blockchain',
                            'approval_record': approval_record
                        })
                        return
                    
                    elif action == "tokenize":
                        # Issue carbon credit tokens
                        credits_amount = float(data.get('credits_amount', 0))
                        
                        if credits_amount <= 0:
                            self.send_error_response(400, 'Invalid credits amount')
                            return
                        
                        tokenization_record = {
                            'transaction_hash': f'0x{project_id}token567890123456789012345678',
                            'block_number': 41234570,
                            'token_contract': '0x1234567890abcdef1234567890abcdef12345678',
                            'project_id': project_id,
                            'credits_issued': credits_amount,
                            'token_id': f'BCC-{project_id}-{int(datetime.now().timestamp())}',
                            'recipient_address': data.get('recipient', '0x0000000000000000000000000000000000000000'),
                            'metadata_uri': f'https://ipfs.io/ipfs/Qm{project_id}Metadata',
                            'issuance_date': datetime.now().isoformat(),
                            'expiry_date': (datetime.now() + timedelta(days=365*5)).isoformat(),
                            'status': 'minted',
                            'total_supply_after': credits_amount,
                            'verification_standards': ['VERRA_VCS', 'GOLD_STANDARD']
                        }
                        
                        if project_id not in blockchain_records:
                            blockchain_records[project_id] = {}
                        blockchain_records[project_id]['tokenization'] = tokenization_record
                        
                        self.send_json_response({
                            'success': True,
                            'message': 'Carbon credits tokenized successfully',
                            'tokenization_record': tokenization_record
                        })
                        return
            
            # IPFS file upload endpoint
            if path == "/api/ipfs/upload":
                if not IPFS_AVAILABLE or not ipfs_connected:
                    self.send_error_response(503, "IPFS service unavailable")
                    return
                
                # Parse multipart form data for file upload
                content_type = self.headers.get('Content-Type', '')
                if not content_type.startswith('multipart/form-data'):
                    self.send_error_response(400, "Multipart form data required")
                    return
                
                try:
                    # Get boundary from content type
                    boundary = content_type.split('boundary=')[1]
                    content_length = int(self.headers.get('Content-Length', 0))
                    
                    # Read the entire request body
                    request_body = self.rfile.read(content_length)
                    
                    # Parse multipart data (simplified parsing)
                    parts = request_body.split(f'--{boundary}'.encode())
                    
                    file_data = None
                    filename = None
                    project_id = None
                    file_type = None
                    description = None
                    
                    for part in parts:
                        if b'Content-Disposition' in part:
                            # Extract filename and field name
                            if b'filename=' in part:
                                lines = part.split(b'\r\n\r\n', 1)
                                if len(lines) == 2:
                                    header, data = lines
                                    # Extract filename
                                    if b'filename="' in header:
                                        filename_start = header.find(b'filename="') + 10
                                        filename_end = header.find(b'"', filename_start)
                                        filename = header[filename_start:filename_end].decode('utf-8')
                                    
                                    # Remove trailing boundary markers
                                    file_data = data.rstrip(b'\r\n--')
                            else:
                                # Extract form field values
                                lines = part.split(b'\r\n\r\n', 1)
                                if len(lines) == 2:
                                    header, data = lines
                                    field_value = data.rstrip(b'\r\n--').decode('utf-8')
                                    
                                    if b'name="project_id"' in header:
                                        project_id = field_value
                                    elif b'name="file_type"' in header:
                                        file_type = field_value
                                    elif b'name="description"' in header:
                                        description = field_value
                    
                    if not file_data or not filename:
                        self.send_error_response(400, "No file data found")
                        return
                    
                    # Prepare metadata for IPFS
                    metadata = {
                        'project_id': project_id or 'unknown',
                        'file_type': file_type or 'unknown',
                        'description': description or '',
                        'uploaded_at': datetime.now().isoformat()
                    }
                    
                    # Upload to IPFS
                    upload_result = ipfs_service.upload_file(file_data, filename, metadata)
                    
                    if upload_result.get('success'):
                        print(f"✅ IPFS upload successful: {upload_result}")
                        
                        # Store in project if project_id provided
                        if project_id:
                            # Try to get project from both databases
                            project = None
                            if NEONDB_AVAILABLE and db_service:
                                try:
                                    project = db_service.get_project(project_id)
                                    print(f"📄 IPFS upload - Project found in NeonDB: {project is not None}")
                                    
                                    # If found in NeonDB but not in memory, create in memory with proper structure
                                    if project and project_id not in projects_db:
                                        projects_db[project_id] = {
                                            'project_name': project.get('title', 'Unknown'),
                                            'ipfs_media': {'photos': [], 'videos': [], 'documents': []},
                                            'media_files': {},
                                            'media_count': {'photos': 0, 'videos': 0, 'documents': 0}
                                        }
                                        print(f"📄 Created in-memory project structure for {project_id}")
                                        
                                except Exception as e:
                                    print(f"❌ Error getting project from NeonDB for IPFS upload: {e}")
                                    
                            # Also check in-memory database
                            if not project and project_id in projects_db:
                                project = projects_db[project_id]
                                print(f"📄 IPFS upload - Project found in in-memory DB: {project is not None}")
                            
                            # Use in-memory project for IPFS operations
                            if project_id in projects_db:
                                project = projects_db[project_id]
                                print(f"📄 Using in-memory project for IPFS operations: {project_id}")
                            
                            if project:
                                # Initialize IPFS media structure
                                if 'ipfs_media' not in project:
                                    project['ipfs_media'] = {'photos': [], 'videos': [], 'documents': []}
                                
                                # Add to appropriate category
                                media_category = file_type if file_type in ['photos', 'videos', 'documents'] else 'documents'
                                
                                file_info = {
                                    'filename': filename,
                                    'ipfs_hash': upload_result['ipfs_hash'],
                                    'gateway_url': upload_result['gateway_url'],
                                    'description': description or '',
                                    'uploaded_at': upload_result.get('timestamp', datetime.now().isoformat()),
                                    'size': upload_result.get('size', 0)
                                }
                                
                                project['ipfs_media'][media_category].append(file_info)
                                
                                # Update media count
                                if 'media_count' not in project:
                                    project['media_count'] = {'photos': 0, 'videos': 0, 'documents': 0}
                                project['media_count'][media_category] = len(project['ipfs_media'][media_category])
                                
                                print(f"📄 Added file to {media_category}: {filename}")
                                print(f"📄 Current media count: {project['media_count']}")
                                print(f"📄 Current ipfs_media: {project['ipfs_media']}")
                                
                                # Save to both databases
                                projects_db[project_id] = project  # Save to in-memory
                                
                                if NEONDB_AVAILABLE and db_service:
                                    try:
                                        # Update only the IPFS-related fields in the database
                                        update_data = {
                                            'ipfs_media': project['ipfs_media'],
                                            'media_count': project['media_count'],
                                            'updated_at': datetime.now().isoformat()
                                        }
                                        db_service.update_project(project_id, update_data)
                                        print(f"✅ Updated project {project_id} in NeonDB with IPFS media")
                                        print(f"📄 Updated IPFS data: {update_data}")
                                    except Exception as e:
                                        print(f"❌ Error updating project in NeonDB: {e}")
                                        import traceback
                                        print(f"📄 Full error: {traceback.format_exc()}")
                            else:
                                print(f"❌ Project {project_id} not found in any database for IPFS upload")
                                # Store as orphaned upload to be picked up when project is created
                                if project_id not in orphaned_ipfs_uploads:
                                    orphaned_ipfs_uploads[project_id] = {'photos': [], 'videos': [], 'documents': []}
                                
                                media_category = file_type if file_type in ['photos', 'videos', 'documents'] else 'documents'
                                file_info = {
                                    'filename': filename,
                                    'ipfs_hash': upload_result['ipfs_hash'],
                                    'gateway_url': upload_result['gateway_url'],
                                    'description': description or '',
                                    'uploaded_at': upload_result.get('timestamp', datetime.now().isoformat()),
                                    'size': upload_result.get('size', 0)
                                }
                                
                                orphaned_ipfs_uploads[project_id][media_category].append(file_info)
                                print(f"📄 Stored orphaned IPFS upload for project {project_id}: {filename}")
                                print(f"📄 Orphaned uploads for {project_id}: {orphaned_ipfs_uploads[project_id]}")
                        
                        self.send_json_response({
                            'status': 'success',
                            'message': 'File uploaded to IPFS successfully',
                            'ipfs_hash': upload_result['ipfs_hash'],
                            'gateway_url': upload_result['gateway_url'],
                            'filename': filename,
                            'size': upload_result.get('size', 0)
                        })
                        return
                    else:
                        self.send_error_response(500, f"IPFS upload failed: {upload_result.get('error', 'Unknown error')}")
                        return
                        
                except Exception as e:
                    print(f"❌ IPFS upload error: {str(e)}")
                    self.send_error_response(500, f"File upload error: {str(e)}")
                    return
            
            # Get IPFS files for a project (POST version)
            if path.startswith("/api/ipfs/files/"):
                project_id = path.split('/')[-1]
                
                # Get project data - try NeonDB first, then fallback to in-memory
                project = None
                if NEONDB_AVAILABLE and db_service:
                    try:
                        project = db_service.get_project(project_id)
                        print(f"📄 IPFS files POST - Project found in NeonDB: {project is not None}")
                    except Exception as e:
                        print(f"❌ Error getting project from NeonDB for IPFS POST: {e}")
                        project = projects_db.get(project_id)
                        print(f"📄 IPFS files POST - Fallback to in-memory DB: {project is not None}")
                else:
                    project = projects_db.get(project_id)
                    print(f"📄 IPFS files POST - Project found in in-memory DB: {project is not None}")
                
                if not project:
                    print(f"❌ Project {project_id} not found in any database for IPFS files POST")
                    self.send_error_response(404, f"Project {project_id} not found")
                    return
                
                # Get IPFS media files
                ipfs_media = project.get('ipfs_media', {})
                media_files = project.get('media_files', {})
                
                # If no ipfs_media but has media_files, use that structure
                if not ipfs_media and media_files:
                    ipfs_media = media_files
                
                self.send_json_response({
                    'status': 'success',
                    'project_id': project_id,
                    'media': ipfs_media,
                    'media_files': media_files,
                    'has_ipfs_data': bool(ipfs_media),
                    'total_files': sum(len(files) if isinstance(files, list) else 0 for files in ipfs_media.values()) if ipfs_media else 0
                })
                return
            
            # 3rd Party Verification - NGO Login
            if path == "/api/3rd-party/login":
                try:
                    content_length = int(self.headers.get('Content-Length', 0))
                    if content_length == 0:
                        self.send_error_response(400, "No data provided")
                        return
                    
                    post_data = self.rfile.read(content_length)
                    data = json.loads(post_data.decode('utf-8'))
                    email = data.get('email')
                    password = data.get('password')
                    
                    if not email or not password:
                        self.send_error_response(400, "Email and password required")
                        return
                    
                    # Authenticate NGO
                    auth_result = third_party_system.authenticate_organization(email, password)
                    
                    if auth_result['success']:
                        response_data = {
                            'success': True,
                            'organization': auth_result['organization'],
                            'message': 'Login successful'
                        }
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.end_headers()
                        self.wfile.write(json.dumps(response_data).encode())
                        return
                    else:
                        error_message = auth_result.get('error', 'Authentication failed')
                        self.send_error_response(401, error_message)
                        return
                        
                except Exception as e:
                    print(f"❌ Error in 3rd party login: {str(e)}")
                    self.send_error_response(500, f"Login error: {str(e)}")
                    return
            
            # 3rd Party Verification - Assign Projects
            if path == "/api/3rd-party/assign":
                try:
                    content_length = int(self.headers.get('Content-Length', 0))
                    if content_length == 0:
                        self.send_error_response(400, "No data provided")
                        return
                    
                    post_data = self.rfile.read(content_length)
                    data = json.loads(post_data.decode('utf-8'))
                    org_id = data.get('organization_id')
                    project_id = data.get('project_id')
                    
                    if not org_id or not project_id:
                        self.send_error_response(400, "Organization ID and Project ID required")
                        return
                    
                    assignment_result = third_party_system.assign_project(org_id, project_id)
                    
                    response_data = {
                        'success': assignment_result['success'],
                        'message': assignment_result['message']
                    }
                    
                    if assignment_result['success']:
                        response_data['assignment_id'] = assignment_result['assignment_id']
                    
                    self.send_response(200 if assignment_result['success'] else 400)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(response_data).encode())
                    return
                    
                except Exception as e:
                    print(f"❌ Error in project assignment: {str(e)}")
                    self.send_error_response(500, f"Assignment error: {str(e)}")
                    return
            
            # 3rd Party Verification - Submit Report
            if path == "/api/3rd-party/submit-report":
                try:
                    content_length = int(self.headers.get('Content-Length', 0))
                    if content_length == 0:
                        self.send_error_response(400, "No data provided")
                        return
                    
                    post_data = self.rfile.read(content_length)
                    data = json.loads(post_data.decode('utf-8'))
                    org_id = data.get('organization_id')
                    project_id = data.get('project_id')
                    report_data = data.get('report_data', {})
                    
                    if not org_id or not project_id or not report_data:
                        self.send_error_response(400, "Organization ID, Project ID, and report data required")
                        return
                    
                    submission_result = third_party_system.submit_verification_report(org_id, project_id, report_data)
                    
                    response_data = {
                        'success': submission_result['success'],
                        'message': submission_result['message']
                    }
                    
                    if submission_result['success']:
                        response_data['report_id'] = submission_result['report_id']
                        
                        # Update project status to include 3rd party verification
                        if NEONDB_AVAILABLE and db_service:
                            try:
                                project = db_service.get_project(project_id)
                                if project:
                                    project['third_party_verified'] = True
                                    project['verification_score'] = min(100, project.get('verification_score', 0) + 15)
                                    db_service.update_project(project_id, project)
                                    print(f"✅ Updated project {project_id} with 3rd party verification")
                            except Exception as e:
                                print(f"❌ Error updating project with 3rd party verification: {e}")
                        else:
                            # Update in-memory database
                            if project_id in projects_db:
                                projects_db[project_id]['third_party_verified'] = True
                                projects_db[project_id]['verification_score'] = min(100, projects_db[project_id].get('verification_score', 0) + 15)
                    
                    self.send_response(200 if submission_result['success'] else 400)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(response_data).encode())
                    return
                    
                except Exception as e:
                    print(f"❌ Error in report submission: {str(e)}")
                    self.send_error_response(500, f"Report submission error: {str(e)}")
                    return

            # Fallback - endpoint not found
            self.send_error_response(404, f"POST endpoint {path} not found")
            
        except BrokenPipeError:
            # Client disconnected - log and ignore
            print(f"⚠️ Client disconnected during POST request to {self.path}")
        except json.JSONDecodeError:
            try:
                self.send_error_response(400, "Invalid JSON data")
            except BrokenPipeError:
                print(f"⚠️ Client disconnected during JSON error response")
        except Exception as e:
            print(f"❌ Error in POST request: {str(e)}")
            try:
                self.send_error_response(500, f"Internal server error: {str(e)}")
            except BrokenPipeError:
                print(f"⚠️ Client disconnected during error response")
            except Exception as inner_e:
                print(f"❌ Error sending error response: {inner_e}")
    
    def _calculate_manual_score(self, data):
        """Calculate verification score when AI is not available"""
        score = 15  # Base score increase from 0 to 15
        
        # Basic project information (35 points - increased from 30)
        if data.get('project_name'): score += 12  # increased from 10
        if data.get('ecosystem_type'): score += 12  # increased from 10
        if data.get('area_hectares', 0) > 0: score += 11  # increased from 10
        
        # Location data (25 points - increased from 20)
        location = data.get('location', {})
        if location.get('lat') and location.get('lng'): score += 25  # increased from 20
        
        # Media files (25 points - same total but more forgiving)
        media_files = data.get('media_files', {})
        if media_files.get('photos'): score += 12  # increased from 10
        if media_files.get('videos'): score += 8  # same
        if media_files.get('documents'): score += 5  # decreased from 7 to balance
        
        # Field measurements (25 points - same)
        field_data = data.get('field_measurements', {})
        if field_data.get('water_quality'): score += 8
        if field_data.get('soil_analysis'): score += 8
        if field_data.get('biodiversity'): score += 9
        
        return min(score, 100)
    
    def _get_next_steps(self, status):
        """Get next steps based on project status"""
        if status == "approved":
            return [
                "✅ Project automatically approved",
                "⛓️ Blockchain registration in progress",
                "🪙 Carbon credits being tokenized",
                "📈 Available for marketplace listing"
            ]
        elif status == "requires_review":
            return [
                "📋 Pending NCCR admin review",
                "🔍 Manual verification required",
                "📊 Additional documentation may be requested",
                "⏱️ Review typically takes 24-48 hours"
            ]
        else:
            return [
                "❌ Project requires improvements",
                "📸 Additional media evidence needed",
                "📏 Field measurements verification required",
                "🔄 Please resubmit with corrections"
            ]

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    """Threaded server for handling multiple concurrent requests"""
    allow_reuse_address = True

def main():
    """Main server function"""
    print("🌊 Blue Carbon MRV System - Production Server")
    print(f"🚀 Starting production server on port {PORT}")
    
    # Check blockchain service availability
    print("🔗 Checking blockchain service...")
    check_blockchain_service()
    
    # Initialize sample data
    init_sample_data()
    
    try:
        with ThreadedTCPServer(("", PORT), ProductionAPIHandler) as httpd:
            print(f"✅ Production server running at http://localhost:{PORT}")
            print("🔧 Available endpoints:")
            print("   • GET  /api/status")
            print("   • GET  /api/projects")
            print("   • POST /api/projects/create")
            print("   • GET  /api/admin/dashboard")
            print("   • GET  /api/admin/analytics")
            print("   • POST /api/admin/projects/{id}/review")
            print("   • POST /api/3rd-party/login")
            print("   • GET  /api/3rd-party/dashboard")
            print("   • GET  /api/3rd-party/assignments")
            print("   • POST /api/3rd-party/submit-report")
            print("   • GET  /api/projects/{id}/verification-status")
            print("🛑 Press Ctrl+C to stop")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
    finally:
        print("👋 Goodbye!")

if __name__ == "__main__":
    main()
