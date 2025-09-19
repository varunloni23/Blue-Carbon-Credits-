#!/usr/bin/env python3
"""
IPFS Integration Service using Pinata
Handles file uploads, metadata storage, and retrieval for the Blue Carbon MRV system
"""

import requests
import json
import os
import base64
from typing import Dict, List, Optional, Union
import mimetypes
from datetime import datetime

class PinataIPFSService:
    """Service class for interacting with Pinata IPFS"""
    
    def __init__(self, api_key: str, api_secret: str, jwt_token: str):
        self.api_key = api_key
        self.api_secret = api_secret
        self.jwt_token = jwt_token
        self.base_url = "https://api.pinata.cloud"
        self.gateway_url = "https://gateway.pinata.cloud/ipfs"
        
        # Headers for authentication
        self.headers = {
            'Authorization': f'Bearer {jwt_token}',
            'Content-Type': 'application/json'
        }
        
        self.upload_headers = {
            'Authorization': f'Bearer {jwt_token}'
        }
    
    def test_connection(self) -> bool:
        """Test connection to Pinata API"""
        try:
            url = f"{self.base_url}/data/testAuthentication"
            response = requests.get(url, headers=self.headers)
            return response.status_code == 200
        except Exception as e:
            print(f"❌ IPFS connection test failed: {e}")
            return False
    
    def upload_file(self, file_data: bytes, filename: str, metadata: Dict = None) -> Dict:
        """
        Upload a file to IPFS via Pinata
        
        Args:
            file_data: Binary file data
            filename: Original filename
            metadata: Additional metadata to store with the file
            
        Returns:
            Dict containing IPFS hash and file info
        """
        try:
            url = f"{self.base_url}/pinning/pinFileToIPFS"
            
            # Prepare the file data
            files = {
                'file': (filename, file_data, self._get_mime_type(filename))
            }
            
            # Prepare metadata
            pin_metadata = {
                'name': filename,
                'keyvalues': {
                    'project_id': metadata.get('project_id', ''),
                    'file_type': metadata.get('file_type', 'unknown'),
                    'uploaded_at': datetime.now().isoformat(),
                    'description': metadata.get('description', ''),
                    'ecosystem_type': metadata.get('ecosystem_type', ''),
                    'location': json.dumps(metadata.get('location', {}))
                }
            }
            
            data = {
                'pinataMetadata': json.dumps(pin_metadata),
                'pinataOptions': json.dumps({
                    'cidVersion': 1
                })
            }
            
            response = requests.post(url, files=files, data=data, headers=self.upload_headers)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'ipfs_hash': result['IpfsHash'],
                    'size': result['PinSize'],
                    'timestamp': result['Timestamp'],
                    'gateway_url': f"{self.gateway_url}/{result['IpfsHash']}",
                    'filename': filename,
                    'metadata': metadata
                }
            else:
                return {
                    'success': False,
                    'error': f"Upload failed: {response.text}",
                    'status_code': response.status_code
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f"Upload error: {str(e)}"
            }
    
    def upload_json(self, data: Dict, name: str = "data.json") -> Dict:
        """Upload JSON data to IPFS"""
        try:
            url = f"{self.base_url}/pinning/pinJSONToIPFS"
            
            payload = {
                'pinataContent': data,
                'pinataMetadata': {
                    'name': name,
                    'keyvalues': {
                        'type': 'json_data',
                        'uploaded_at': datetime.now().isoformat()
                    }
                }
            }
            
            response = requests.post(url, json=payload, headers=self.headers)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'ipfs_hash': result['IpfsHash'],
                    'size': result['PinSize'],
                    'timestamp': result['Timestamp'],
                    'gateway_url': f"{self.gateway_url}/{result['IpfsHash']}"
                }
            else:
                return {
                    'success': False,
                    'error': f"JSON upload failed: {response.text}"
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f"JSON upload error: {str(e)}"
            }
    
    def get_file_list(self, project_id: str = None) -> List[Dict]:
        """Get list of pinned files, optionally filtered by project_id"""
        try:
            url = f"{self.base_url}/data/pinList"
            params = {
                'status': 'pinned',
                'pageLimit': 1000
            }
            
            if project_id:
                params['metadata[keyvalues][project_id]'] = {
                    'value': project_id,
                    'op': 'eq'
                }
            
            response = requests.get(url, headers=self.headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                files = []
                
                for row in data.get('rows', []):
                    file_info = {
                        'ipfs_hash': row['ipfs_pin_hash'],
                        'size': row['size'],
                        'date_pinned': row['date_pinned'],
                        'gateway_url': f"{self.gateway_url}/{row['ipfs_pin_hash']}",
                        'metadata': row.get('metadata', {})
                    }
                    files.append(file_info)
                
                return files
            else:
                print(f"❌ Failed to get file list: {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ Error getting file list: {e}")
            return []
    
    def get_file_metadata(self, ipfs_hash: str) -> Dict:
        """Get metadata for a specific IPFS file"""
        try:
            url = f"{self.base_url}/data/pinList"
            params = {
                'hashContains': ipfs_hash,
                'status': 'pinned'
            }
            
            response = requests.get(url, headers=self.headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('rows'):
                    row = data['rows'][0]
                    return {
                        'ipfs_hash': row['ipfs_pin_hash'],
                        'size': row['size'],
                        'date_pinned': row['date_pinned'],
                        'gateway_url': f"{self.gateway_url}/{row['ipfs_pin_hash']}",
                        'metadata': row.get('metadata', {})
                    }
            
            return {}
            
        except Exception as e:
            print(f"❌ Error getting file metadata: {e}")
            return {}
    
    def unpin_file(self, ipfs_hash: str) -> bool:
        """Remove a file from IPFS (unpin it)"""
        try:
            url = f"{self.base_url}/pinning/unpin/{ipfs_hash}"
            response = requests.delete(url, headers=self.headers)
            return response.status_code == 200
        except Exception as e:
            print(f"❌ Error unpinning file: {e}")
            return False
    
    def _get_mime_type(self, filename: str) -> str:
        """Get MIME type for a file"""
        mime_type, _ = mimetypes.guess_type(filename)
        return mime_type or 'application/octet-stream'
    
    def get_storage_usage(self) -> Dict:
        """Get storage usage statistics"""
        try:
            url = f"{self.base_url}/data/userPinnedDataTotal"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                return {}
                
        except Exception as e:
            print(f"❌ Error getting storage usage: {e}")
            return {}

# Global IPFS service instance
ipfs_service = PinataIPFSService(
    api_key="85c5751c24af2f1111ab",
    api_secret="303ff32b75eb324da71cfef5afda9f519ad227d9bebd77f0ff4f28117ffd5e74",
    jwt_token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzNmE2ZDM4NC00MDYxLTRlNGEtODM3NC1iZWZjYTgzNzBiY2UiLCJlbWFpbCI6InJhemF2Y2ZAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6Ijg1YzU3NTFjMjRhZjJmMTExMWFiIiwic2NvcGVkS2V5U2VjcmV0IjoiMzAzZmYzMmI3NWViMzI0ZGE3MWNmZWY1YWZkYTlmNTE5YWQyMjdkOWJlYmQ3N2YwZmY0ZjI4MTE3ZmZkNWU3NCIsImV4cCI6MTc4OTUwMDM2N30.c3LX7YTX7T_rjmI9jhUJmi2Lx1tCXj5gmp_E48s6siA"
)

def test_ipfs_connection():
    """Test IPFS connection and print result"""
    print("🔗 Testing IPFS connection...")
    if ipfs_service.test_connection():
        print("✅ IPFS connection successful!")
        
        # Get storage usage
        usage = ipfs_service.get_storage_usage()
        if usage:
            print(f"📊 Storage used: {usage.get('pin_count', 0)} files, {usage.get('pin_size_total', 0)} bytes")
        
        return True
    else:
        print("❌ IPFS connection failed!")
        return False

if __name__ == "__main__":
    test_ipfs_connection()