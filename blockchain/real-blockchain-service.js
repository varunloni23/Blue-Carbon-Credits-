const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Polygon Amoy testnet configuration
const POLYGON_AMOY_RPC = 'https://rpc-amoy.polygon.technology/';
const CHAIN_ID = 80002;

// Smart contract addresses (deployed on Polygon Amoy)
const CONTRACT_ADDRESSES = {
    ProjectRegistry: '0x331A9336B7855E32B46F78053a963dc7FB6e3281',
    CarbonCreditToken: '0x50DB160bb4dfA789D600b5Be7eD80f66993b7620',
    UniqueCarbonCreditNFT: '0x8cB6Db9a056D2C9cEaD3860B2035ed0FEDaBE2Db',
    PaymentDistributor: '0xC69d14B24D6330fBA0a7527fc0da64199E038a6f',
    VerificationOracle: '0x0313771d7FB6A6460D7144eC660E2949eEdd515e'
};

// Contract ABIs (simplified for key functions)
const PROJECT_REGISTRY_ABI = [
    "function registerProject(string memory _name, string memory _description, uint8 _ecosystemType, string memory _location, uint256 _areaInHectares, address[] memory _communityWallets, string memory _ipfsHashMetadata, uint256 _estimatedCarbonCredits) external returns (uint256)",
    "function getProject(uint256 _projectId) external view returns (tuple(uint256 id, string name, string description, uint8 ecosystemType, string location, uint256 areaInHectares, address projectOwner, address[] communityWallets, address[] verifiers, uint8 status, uint256 createdAt, uint256 approvedAt, string ipfsHashMetadata, uint256 estimatedCarbonCredits, uint256 totalCarbonCredits, bool isActive))",
    "function getTotalProjects() external view returns (uint256)"
];

const CARBON_CREDIT_ABI = [
    "function mint(address to, uint256 amount, string memory batchId) external",
    "function balanceOf(address account) external view returns (uint256)",
    "function totalSupply() external view returns (uint256)"
];

// Initialize provider and contracts
const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);

// Validate private key
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey || privateKey === '0x' + '0'.repeat(64)) {
    console.error('❌ Error: PRIVATE_KEY not found in environment variables');
    console.log('Please set PRIVATE_KEY in your .env file');
    process.exit(1);
}

console.log('🔑 Using wallet address:', ethers.computeAddress(privateKey));

const wallet = new ethers.Wallet(privateKey, provider);

// Contract instances
const projectRegistry = new ethers.Contract(
    CONTRACT_ADDRESSES.ProjectRegistry, 
    PROJECT_REGISTRY_ABI, 
    wallet
);

const carbonCreditToken = new ethers.Contract(
    CONTRACT_ADDRESSES.CarbonCreditToken, 
    CARBON_CREDIT_ABI, 
    wallet
);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        chain: 'Polygon Amoy',
        chainId: CHAIN_ID,
        contracts: CONTRACT_ADDRESSES
    });
});

// Register project on blockchain
app.post('/blockchain/register-project', async (req, res) => {
    try {
        const { title, description, location, ecosystemType, area, communityAddress } = req.body;
        
        console.log('🔗 Registering project on Polygon Amoy blockchain...');
        console.log('Data:', { title, description, location, ecosystemType, area, communityAddress });
        
        // Map ecosystem type to enum
        const ecosystemTypeMap = {
            'mangrove': 0,
            'seagrass': 1,
            'saltmarsh': 2
        };
        
        const ecosystemEnum = ecosystemTypeMap[ecosystemType.toLowerCase()] || 0;
        const communityAddr = communityAddress || '0x0000000000000000000000000000000000000000';
        const areaInWei = ethers.parseUnits(area.toString(), 0); // Convert to BigNumber
        const estimatedCredits = ethers.parseUnits((area * 5).toString(), 0); // Estimate 5 credits per hectare
        
        // Prepare community wallets array (for now, just one address)
        const communityWallets = [communityAddr];
        
        // Register project on blockchain with correct parameters
        const tx = await projectRegistry.registerProject(
            title,                    // _name
            description,              // _description  
            ecosystemEnum,           // _ecosystemType
            location,                // _location
            areaInWei,              // _areaInHectares
            communityWallets,       // _communityWallets
            "",                     // _ipfsHashMetadata (empty for now)
            estimatedCredits        // _estimatedCarbonCredits
        );
        
        console.log('📝 Transaction sent:', tx.hash);
        console.log('⏳ Waiting for confirmation...');
        
        // Wait for transaction confirmation
        const receipt = await tx.wait();
        
        console.log('✅ Transaction confirmed!');
        console.log('🔗 Block number:', receipt.blockNumber);
        console.log('⛽ Gas used:', receipt.gasUsed.toString());
        
        // Get project count to determine the project ID
        const projectCount = await projectRegistry.getTotalProjects();
        const projectId = projectCount.toString();
        
        res.json({
            success: true,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            projectId: projectId,
            gasUsed: receipt.gasUsed.toString(),
            explorerUrl: `https://amoy.polygonscan.com/tx/${tx.hash}`
        });
        
    } catch (error) {
        console.error('❌ Blockchain registration failed:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code
        });
    }
});

// Get project from blockchain
app.get('/blockchain/project/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        console.log('📖 Reading project', projectId, 'from blockchain...');
        
        const project = await projectRegistry.getProject(projectId);
        
        res.json({
            success: true,
            project: {
                id: project.id.toString(),
                name: project.name,
                description: project.description,
                location: project.location,
                ecosystemType: project.ecosystemType,
                area: project.area.toString(),
                community: project.community,
                status: project.status,
                carbonCredits: project.carbonCredits.toString(),
                timestamp: project.timestamp.toString()
            }
        });
        
    } catch (error) {
        console.error('❌ Error reading project:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Mint carbon credits
app.post('/blockchain/mint-credits', async (req, res) => {
    try {
        const { recipient, amount, batchId } = req.body;
        
        console.log('🪙 Minting carbon credits...');
        console.log('Recipient:', recipient);
        console.log('Amount:', amount);
        console.log('Batch ID:', batchId);
        
        const amountInWei = ethers.parseUnits(amount.toString(), 18);
        
        const tx = await carbonCreditToken.mint(recipient, amountInWei, batchId);
        console.log('📝 Transaction sent:', tx.hash);
        
        const receipt = await tx.wait();
        console.log('✅ Credits minted successfully!');
        
        res.json({
            success: true,
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            explorerUrl: `https://amoy.polygonscan.com/tx/${tx.hash}`
        });
        
    } catch (error) {
        console.error('❌ Credit minting failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get contract stats
app.get('/blockchain/stats', async (req, res) => {
    try {
        const projectCount = await projectRegistry.getTotalProjects();
        const totalSupply = await carbonCreditToken.totalSupply();
        
        res.json({
            success: true,
            stats: {
                totalProjects: projectCount.toString(),
                totalCarbonCredits: ethers.formatUnits(totalSupply, 18),
                contracts: CONTRACT_ADDRESSES,
                network: 'Polygon Amoy Testnet',
                chainId: CHAIN_ID
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 8003;
app.listen(PORT, () => {
    console.log('🌊 Real Blockchain Service for Blue Carbon MRV');
    console.log('🚀 Server running on port', PORT);
    console.log('⛓️  Connected to Polygon Amoy testnet');
    console.log('📋 Contract addresses:', CONTRACT_ADDRESSES);
    console.log('🔗 Explorer: https://amoy.polygonscan.com');
    console.log('🛑 Press Ctrl+C to stop');
});

module.exports = app;