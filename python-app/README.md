# Blue Carbon MRV System - Python FastAPI + React

A comprehensive blockchain-based Monitoring, Reporting, and Verification (MRV) system for India's blue carbon ecosystem restoration projects.

## Project Structure
- `backend/` - FastAPI backend services
- `frontend/` - React web application
- `shared/` - Shared configuration and smart contracts

## Technology Stack
- Backend: FastAPI, Web3.py, PostgreSQL
- Frontend: React.js, Material-UI, Web3 integration
- Blockchain: Polygon Mumbai testnet
- Storage: IPFS for decentralized data storage

## Getting Started

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Mac/Linux
pip install -r ../requirements.txt
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Features
- 8-step Blue Carbon MRV workflow
- Blockchain integration with Polygon Mumbai
- IPFS decentralized storage
- Admin dashboard for NCCR
- Carbon credit marketplace
- Automated payment distribution
- Real-time monitoring and reporting
