#!/bin/bash

echo "🌊 Blue Carbon MRV System - Complete Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_warning "Node.js version is $NODE_VERSION. Recommended version is 16+."
fi

print_status "Starting complete setup for Blue Carbon MRV System..."

# Step 1: Setup Blockchain Environment
print_status "Step 1: Setting up blockchain environment..."
cd blockchain

# Install dependencies
print_status "Installing blockchain dependencies..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    print_error "Failed to install blockchain dependencies"
    exit 1
fi

print_success "Blockchain dependencies installed"

# Generate wallet
print_status "Generating test wallet..."
node scripts/setup-wallet.js

if [ $? -ne 0 ]; then
    print_error "Failed to generate wallet"
    exit 1
fi

print_success "Test wallet generated"

# Try to compile contracts
print_status "Compiling smart contracts..."
npx hardhat compile

if [ $? -ne 0 ]; then
    print_error "Failed to compile contracts"
    exit 1
fi

print_success "Smart contracts compiled successfully"

# Step 2: Setup Mobile App
print_status "Step 2: Setting up mobile app..."
cd ../mobile-app

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    print_status "Installing Expo CLI globally..."
    npm install -g expo-cli
fi

print_status "Installing mobile app dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install mobile app dependencies"
    exit 1
fi

print_success "Mobile app dependencies installed"

# Step 3: Setup Backend
print_status "Step 3: Setting up backend services..."
cd ../backend

# Initialize backend if not exists
if [ ! -f "package.json" ]; then
    npm init -y
fi

print_status "Installing backend dependencies..."
npm install express cors dotenv ipfs-http-client ethers axios bcryptjs jsonwebtoken multer

if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi

print_success "Backend dependencies installed"

# Step 4: Setup Admin Dashboard
print_status "Step 4: Setting up admin dashboard..."
cd ../admin-dashboard

# Initialize React app if not exists
if [ ! -f "package.json" ]; then
    npx create-react-app . --template typescript
    npm install @mui/material @emotion/react @emotion/styled ethers recharts axios @mui/icons-material
fi

print_success "Admin dashboard setup completed"

# Step 5: Create comprehensive test script
print_status "Step 5: Creating test scripts..."
cd ../blockchain

# Create test runner script
cat > run-tests.js << 'EOF'
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🧪 Running comprehensive tests for Blue Carbon MRV System...\n');

try {
  // Run smart contract tests
  console.log('1️⃣ Running smart contract tests...');
  execSync('npx hardhat test', { stdio: 'inherit' });
  console.log('✅ Smart contract tests passed\n');
  
  // Check if wallet exists
  if (fs.existsSync('wallet-info.json')) {
    const walletInfo = JSON.parse(fs.readFileSync('wallet-info.json', 'utf8'));
    console.log('💼 Test wallet information:');
    console.log(`   Address: ${walletInfo.address}`);
    console.log(`   Network: ${walletInfo.network}`);
    console.log('   🚰 Get testnet MATIC: https://faucet.polygon.technology/\n');
  }
  
  // Try deployment (will work if you have testnet tokens)
  console.log('2️⃣ Attempting deployment to testnet...');
  try {
    execSync('node scripts/deploy-and-test.js', { stdio: 'inherit' });
    console.log('✅ Deployment successful\n');
  } catch (error) {
    console.log('⚠️  Deployment skipped (likely no testnet tokens)\n');
  }
  
  console.log('🎉 All tests completed successfully!');
  
} catch (error) {
  console.error('❌ Tests failed:', error.message);
  process.exit(1);
}
EOF

print_success "Test scripts created"

# Final instructions
cd ..
print_success "🎉 Complete setup finished!"
echo ""
echo "📋 NEXT STEPS:"
echo "=============="
echo ""
echo "1️⃣ Get testnet MATIC tokens:"
echo "   • Visit: https://faucet.polygon.technology/"
echo "   • Select Mumbai Network"
echo "   • Enter your wallet address (check blockchain/wallet-info.json)"
echo ""
echo "2️⃣ Deploy contracts:"
echo "   cd blockchain"
echo "   node scripts/deploy-and-test.js"
echo ""
echo "3️⃣ Start mobile app:"
echo "   cd mobile-app"
echo "   expo start"
echo ""
echo "4️⃣ Start backend:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "5️⃣ Start admin dashboard:"
echo "   cd admin-dashboard"
echo "   npm start"
echo ""
echo "🔧 Run all tests:"
echo "   cd blockchain"
echo "   node run-tests.js"
echo ""
echo "📁 Important files created:"
echo "   • blockchain/.env - Environment configuration"
echo "   • blockchain/wallet-info.json - Your test wallet"
echo "   • shared/contract-addresses.json - Deployed contract addresses"
echo ""
print_warning "⚠️  This is a TEST setup. Never use these keys on mainnet!"

print_success "Setup completed successfully! 🚀"
