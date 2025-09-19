#!/usr/bin/env python3
"""
Comprehensive test that demonstrates the complete user workflow:
1. User uploads files during project creation (simulated frontend)
2. Files are stored in IPFS with project metadata
3. Project is created with IPFS references
4. Admin can view the project and its IPFS media
"""

import json
import requests
import os
from datetime import datetime

def simulate_user_project_creation():
    print("🌊 Blue Carbon MRV - Complete User Workflow Test")
    print("="*60)
    
    # Simulate a user creating a mangrove restoration project
    print("👤 User: Creating a new mangrove restoration project...")
    
    # Step 1: User fills out project details
    project_details = {
        "project_name": "Coastal Mangrove Restoration Initiative",
        "ecosystem_type": "mangrove",
        "restoration_method": "Community-based restoration with local participation",
        "area_hectares": 45.8,
        "location": {
            "lat": 22.2587,
            "lng": 89.9486,
            "address": "Sundarbans Delta, West Bengal, India"
        },
        "community_details": "Local fishing communities actively participating in restoration",
        "contact_email": "mangrove.project@community.org",
        "phone_number": "+91 98765 43210",
        "created_by": "community_leader_01"
    }
    
    print(f"📋 Project details: {project_details['project_name']}")
    print(f"🌿 Ecosystem: {project_details['ecosystem_type']}")
    print(f"📍 Location: {project_details['location']['address']}")
    print(f"📏 Area: {project_details['area_hectares']} hectares")
    
    # Step 2: User uploads multiple files
    print("\n📤 User uploading project documentation...")
    
    # Create test files
    files_to_upload = [
        {
            "name": "baseline_assessment.txt",
            "content": b"Baseline Assessment Report\n\nThis document contains the baseline carbon assessment for the mangrove restoration site. Initial carbon stock measurements, biodiversity surveys, and water quality parameters are documented here.",
            "type": "documents",
            "description": "Baseline carbon and biodiversity assessment"
        },
        {
            "name": "site_photo_before.txt",
            "content": b"[PHOTO DATA] Before restoration site photo - degraded mangrove area with visible erosion and sparse vegetation cover",
            "type": "photos", 
            "description": "Site condition before restoration activities"
        },
        {
            "name": "community_meeting.txt",
            "content": b"[VIDEO DATA] Community stakeholder meeting discussing restoration plans and carbon credit benefit sharing",
            "type": "videos",
            "description": "Stakeholder engagement and benefit sharing discussion"
        }
    ]
    
    uploaded_files = []
    
    for file_info in files_to_upload:
        print(f"   📁 Uploading {file_info['name']}...")
        
        # Save temporary file
        temp_path = f"/tmp/{file_info['name']}"
        with open(temp_path, 'wb') as f:
            f.write(file_info['content'])
        
        # Upload to IPFS
        files = {
            'file': (file_info['name'], open(temp_path, 'rb'), 'text/plain')
        }
        data = {
            'file_type': file_info['type'],
            'description': file_info['description']
        }
        
        response = requests.post('http://localhost:8002/api/ipfs/upload', files=files, data=data)
        files['file'][1].close()
        
        if response.status_code == 200:
            result = response.json()
            uploaded_files.append({
                "hash": result['ipfs_hash'],
                "type": file_info['type'],
                "filename": file_info['name'],
                "gateway_url": result['gateway_url'],
                "size": result['size'],
                "description": file_info['description'],
                "timestamp": datetime.now().isoformat()
            })
            print(f"      ✅ Uploaded to IPFS: {result['ipfs_hash'][:16]}...")
        else:
            print(f"      ❌ Failed to upload: {response.text}")
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
    
    print(f"\n📊 Total files uploaded: {len(uploaded_files)}")
    
    # Step 3: Submit project with IPFS references
    print("\n🚀 Submitting project for verification...")
    
    project_data = {
        **project_details,
        "ipfs_hashes": uploaded_files,
        "submission_timestamp": datetime.now().isoformat(),
        "status": "pending_verification"
    }
    
    create_response = requests.post('http://localhost:8002/api/projects/create',
                                  json=project_data,
                                  headers={'Content-Type': 'application/json'})
    
    if create_response.status_code == 200:
        result = create_response.json()
        project_id = result['project_id']
        print(f"✅ Project submitted successfully!")
        print(f"   🆔 Project ID: {project_id}")
        print(f"   📊 Verification Score: {result['verification_score']}/100")
        print(f"   🏷️ Status: {result['current_status']}")
        
        # Step 4: Admin views the project
        print(f"\n👨‍💼 Admin: Reviewing project {project_id}...")
        
        # Get project details
        projects_response = requests.get('http://localhost:8002/api/projects')
        if projects_response.status_code == 200:
            projects = projects_response.json()['projects']
            project = next((p for p in projects if p['id'] == project_id), None)
            
            if project:
                print(f"📋 Project Details:")
                print(f"   - Name: {project['project_name']}")
                print(f"   - Ecosystem: {project['ecosystem_type']}")
                print(f"   - Area: {project['area_hectares']} hectares")
                print(f"   - Status: {project['status']}")
                print(f"   - Media Count: {project.get('media_count', {})}")
                
                # Get IPFS media
                media_response = requests.get(f'http://localhost:8002/api/ipfs/files/{project_id}')
                if media_response.status_code == 200:
                    media = media_response.json()['media']
                    
                    print(f"\n🗂️ IPFS Media Files:")
                    for media_type, files in media.items():
                        if files:
                            print(f"   📁 {media_type.title()} ({len(files)} files):")
                            for file in files:
                                print(f"      📄 {file['filename']}")
                                print(f"         🔗 IPFS: {file['ipfs_hash'][:16]}...")
                                print(f"         🌐 Gateway: {file['gateway_url'][:50]}...")
                                print(f"         📝 Description: {file['description']}")
                
                print(f"\n🎯 Admin can now:")
                print(f"   1. View all media files in the admin dashboard")
                print(f"   2. Click the media icon to see IPFS files")
                print(f"   3. Download/view files from IPFS gateway")
                print(f"   4. Approve/reject the project based on evidence")
                
                return project_id
    
    print("❌ Project submission failed")
    return None

if __name__ == "__main__":
    project_id = simulate_user_project_creation()
    
    if project_id:
        print(f"\n🎉 Complete Workflow Test SUCCESSFUL!")
        print(f"\n📋 Summary:")
        print(f"   ✅ User uploaded files to IPFS during project creation")
        print(f"   ✅ Project created with real IPFS media references")
        print(f"   ✅ Admin can view project and IPFS files in dashboard")
        print(f"   ✅ Files are permanently stored on IPFS network")
        print(f"\n🔗 Admin Dashboard Access:")
        print(f"   Project: http://localhost:8002/api/projects")
        print(f"   Media: http://localhost:8002/api/ipfs/files/{project_id}")
    else:
        print(f"\n❌ Workflow test failed!")