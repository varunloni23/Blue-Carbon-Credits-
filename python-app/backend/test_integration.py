#!/usr/bin/env python3
"""
Test script to simulate creating a project with IPFS media uploads
"""

import json
import requests
import os

def test_project_creation_with_ipfs():
    print("🧪 Testing Project Creation with IPFS Integration")
    print("="*60)
    
    # Step 1: Create a test image file
    test_content = b"This is a test image file for Blue Carbon MRV project creation"
    test_file_path = "/Users/razashaikh/Desktop/sih/python-app/backend/test_project_image.txt"
    
    with open(test_file_path, 'wb') as f:
        f.write(test_content)
    
    print("📁 Created test file")
    
    # Step 2: Upload file to IPFS first (simulating frontend file upload)
    print("📤 Uploading file to IPFS...")
    
    files = {
        'file': ('test_project_image.txt', open(test_file_path, 'rb'), 'text/plain')
    }
    data = {
        'file_type': 'photos',
        'description': 'Test image for project creation'
    }
    
    ipfs_response = requests.post('http://localhost:8002/api/ipfs/upload', files=files, data=data)
    files['file'][1].close()  # Close the file
    
    if ipfs_response.status_code == 200:
        ipfs_result = ipfs_response.json()
        print(f"✅ IPFS upload successful: {ipfs_result['ipfs_hash']}")
    else:
        print(f"❌ IPFS upload failed: {ipfs_response.text}")
        return False
    
    # Step 3: Create project with IPFS hash
    print("🏗️ Creating project with IPFS media...")
    
    project_data = {
        "project_name": "Test Mangrove Restoration with IPFS",
        "ecosystem_type": "mangrove",
        "restoration_method": "Community-based restoration",
        "area_hectares": 25.5,
        "location": {
            "lat": 22.2587,
            "lng": 89.9486
        },
        "community_details": "Test community for IPFS integration",
        "contact_email": "test@example.com",
        "phone_number": "+91 12345 67890",
        "created_by": "test_user",
        "ipfs_hashes": [
            {
                "hash": ipfs_result['ipfs_hash'],
                "type": "photos",
                "filename": "test_project_image.txt",
                "gateway_url": ipfs_result['gateway_url'],
                "size": ipfs_result['size'],
                "description": "Test image for project creation",
                "timestamp": "2025-09-16T01:30:00Z"
            }
        ]
    }
    
    create_response = requests.post('http://localhost:8002/api/projects/create', 
                                  json=project_data,
                                  headers={'Content-Type': 'application/json'})
    
    if create_response.status_code == 200:
        create_result = create_response.json()
        project_id = create_result['project_id']
        print(f"✅ Project created successfully: {project_id}")
        
        # Step 4: Verify the project appears in admin dashboard
        print("🔍 Checking project in admin dashboard...")
        
        projects_response = requests.get('http://localhost:8002/api/projects')
        if projects_response.status_code == 200:
            projects_data = projects_response.json()
            
            # Find our project
            test_project = None
            for project in projects_data.get('projects', []):
                if project['id'] == project_id:
                    test_project = project
                    break
            
            if test_project:
                print(f"✅ Project found in database")
                print(f"   - Status: {test_project['status']}")
                print(f"   - Verification Score: {test_project['verification_score']}")
                print(f"   - Media Count: {test_project.get('media_count', {})}")
                
                # Step 5: Check IPFS media endpoint
                print("📷 Checking IPFS media endpoint...")
                media_response = requests.get(f'http://localhost:8002/api/ipfs/files/{project_id}')
                
                if media_response.status_code == 200:
                    media_data = media_response.json()
                    photos = media_data.get('media', {}).get('photos', [])
                    
                    if photos:
                        print(f"✅ IPFS media found: {len(photos)} photos")
                        for photo in photos:
                            print(f"   - {photo['filename']}: {photo['ipfs_hash']}")
                            print(f"   - Gateway: {photo['gateway_url']}")
                    else:
                        print("❌ No IPFS media found")
                else:
                    print(f"❌ Failed to get IPFS media: {media_response.text}")
            else:
                print("❌ Project not found in database")
        else:
            print(f"❌ Failed to get projects: {projects_response.text}")
        
        return project_id
    else:
        print(f"❌ Project creation failed: {create_response.text}")
        return False

if __name__ == "__main__":
    project_id = test_project_creation_with_ipfs()
    
    if project_id:
        print(f"\n🎉 Integration test successful!")
        print(f"Project ID: {project_id}")
        print(f"Admin can view this project's IPFS media at:")
        print(f"http://localhost:8002/api/ipfs/files/{project_id}")
    else:
        print("\n❌ Integration test failed!")