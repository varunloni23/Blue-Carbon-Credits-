# Blue Carbon MRV System 🌊

A comprehensive blockchain-based Monitoring, Reporting, and Verification (MRV) system for India's blue carbon ecosystem restoration projects.

## 🏗️ System Architecture

This system consists of three main components:

### 1. **Backend** - Main Blockchain Server
- **Location**: `backend/server.js`
- **Purpose**: Core blockchain integration and API services
- **Technology**: Node.js + Express + Web3
- **Features**: Smart contract interaction, IPFS integration, database management

### 2. **Admin Dashboard** - NCCR Interface  
- **Location**: `admin-dashboard/`
- **Purpose**: Government admin interface for project review and approval
- **Technology**: React web application
- **Features**: Project review, approval workflow, system monitoring

### 3. **Python App** - User Application
- **Location**: `python-app/`
- **Purpose**: End-user interface for field officers and communities
- **Technology**: FastAPI backend + React frontend
- **Features**: Project creation, MRV data collection, marketplace access

## 🚀 Quick Start

### Start Main Backend (Blockchain Server)
```bash
cd backend
npm install
npm start
# Runs on: http://localhost:5000
```

### Start Admin Dashboard
```bash
cd admin-dashboard  
npm install
npm start
# Runs on: http://localhost:3001
```

### Start User Application
```bash
cd python-app
# Backend
cd backend
python3 simple_server.py &
# Frontend  
cd ../frontend
npm install
npm start
# Runs on: http://localhost:3000
```

## 📱 System Components

### Blockchain Integration
- **Network**: Polygon Mumbai Testnet
- **Smart Contracts**: Project Registry, Carbon Credits, Payment Distribution
- **Storage**: IPFS for off-chain data

### MRV Workflow (8-Step Process)
1. **Project Registration** - Create restoration projects
2. **NCCR Review** - Government approval process  
3. **Data Collection** - Field MRV data gathering
4. **Verification** - Multi-source data verification
5. **Tokenization** - Carbon credit generation
6. **Marketplace** - Credit trading platform
7. **Payments** - Automated community distribution
8. **Reporting** - Transparency and audit trails

## 🔧 Technology Stack

- **Blockchain**: Hardhat, Solidity, Web3.js, Polygon
- **Backend**: Node.js, Express, FastAPI, Python
- **Frontend**: React, Material-UI
- **Storage**: IPFS, NeonDB PostgreSQL
- **Authentication**: JWT, Web3 wallets

## 📊 Features

✅ **Complete MRV Workflow**  
✅ **Blockchain Integration**  
✅ **Multi-User Interface** (Admin + User apps)  
✅ **Carbon Credit Marketplace**  
✅ **Automated Payments**  
✅ **Transparency Reporting**  
✅ **IPFS Decentralized Storage**  

## 🌊 Blue Carbon Focus

Supports restoration of:
- **Mangroves** - Coastal protection and carbon sequestration
- **Seagrass Meadows** - Marine ecosystem restoration  
- **Salt Marshes** - Coastal wetland conservation
- **Coastal Wetlands** - Integrated ecosystem restoration

---

**Built for Smart India Hackathon 2024**  
*Empowering communities through transparent blue carbon restoration*
