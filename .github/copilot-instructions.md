# Blue Carbon MRV System - Copilot Instructions

This is a comprehensive blockchain-based Monitoring, Reporting, and Verification (MRV) system for India's blue carbon ecosystem restoration projects.

## Project Structure
- `blockchain/` - Smart contracts using Hardhat and Polygon Mumbai testnet
- `mobile-app/` - React Native cross-platform mobile application
- `admin-dashboard/` - Web-based admin dashboard for NCCR
- `backend/` - Node.js backend services for blockchain integration
- `marketplace/` - Web-based carbon credit marketplace
- `ipfs-storage/` - IPFS integration for off-chain data storage
- `shared/` - Shared configuration and contract addresses

## Technology Stack
- Blockchain: Hardhat, Solidity, Polygon Mumbai testnet, OpenZeppelin
- Mobile: React Native with Expo, offline data sync, Web3 integration
- Frontend: React.js with Material-UI, Web3 integration
- Backend: Node.js, Express.js, NeonDB PostgreSQL
- Storage: IPFS for large files, AsyncStorage for mobile
- Payment: Crypto-to-INR conversion APIs, UPI integration

## Key Features Implemented
- ✅ Smart contracts for carbon credit tokenization (ERC-20/ERC-1155)
- ✅ Multi-source verification oracle system
- ✅ Automated payment distribution to communities
- ✅ Mobile app foundation with offline sync
- ✅ Blockchain wallet integration
- ✅ Project registry with immutable metadata
- ✅ IPFS integration framework

## Smart Contracts Completed
- `ProjectRegistry.sol` - Project registration and management
- `CarbonCreditToken.sol` - ERC-20 carbon credits with batch tracking
- `UniqueCarbonCreditNFT.sol` - ERC-1155 certificate NFTs
- `PaymentDistributor.sol` - Automated payment splits
- `VerificationOracle.sol` - Multi-source data verification

## Mobile App Progress
- ✅ Navigation structure and UI framework
- ✅ Offline data collection context
- ✅ Blockchain integration context
- ✅ Home screen with dashboard
- ⏳ Data collection screen (camera, GPS, voice)
- ⏳ Projects screen
- ⏳ Profile screen

## Progress Tracking
- [x] Project structure setup
- [x] Smart contracts development (COMPLETE)
- [x] Mobile app foundation (60% complete)
- [ ] Admin dashboard (structure ready)
- [ ] Backend services (API design ready)
- [ ] IPFS integration (framework ready)
- [ ] Marketplace UI (structure ready)
- [x] Testing framework setup

## Development Commands
- `cd blockchain && npm test` - Run smart contract tests
- `cd mobile-app && expo start` - Start mobile app development
- `cd blockchain && npm run deploy:mumbai` - Deploy to testnet

## Next Priorities
1. Complete mobile app data collection screens
2. Implement backend API services
3. Build admin dashboard monitoring
4. Create marketplace UI
5. End-to-end testing and deployment
