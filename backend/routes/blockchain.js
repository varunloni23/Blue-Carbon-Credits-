const express = require('express');
const { ethers } = require('ethers');
const contractAddresses = require('../../shared/contract-addresses.json');

const router = express.Router();

// Smart contract ABIs (simplified for key functions)
const ProjectRegistryABI = [
  "function registerProject(string memory name, string memory location, uint256 area, string memory ipfsHash) external returns (uint256)",
  "function getProject(uint256 projectId) external view returns (tuple(uint256 id, string name, string location, uint256 area, string ipfsHash, address owner, bool verified, uint256 createdAt))",
  "function verifyProject(uint256 projectId) external",
  "function getProjectCount() external view returns (uint256)",
  "event ProjectRegistered(uint256 indexed projectId, address indexed owner, string name)"
];

const CarbonCreditABI = [
  "function mint(address to, uint256 amount, uint256 projectId, string memory batchId) external",
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function retire(uint256 amount, string memory reason) external",
  "function getProjectCredits(uint256 projectId) external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event CreditsMinted(address indexed to, uint256 amount, uint256 projectId, string batchId)"
];

// Initialize blockchain connection
let provider, wallet, projectRegistry, carbonCredit;

function initializeBlockchain() {
  try {
    provider = new ethers.providers.JsonRpcProvider(process.env.MUMBAI_RPC_URL || 'https://rpc-amoy.polygon.technology/');
    
    if (!process.env.PRIVATE_KEY) {
      console.warn('⚠️ PRIVATE_KEY not found in environment variables');
      return;
    }
    
    if (!contractAddresses.ProjectRegistry || !contractAddresses.CarbonCreditToken) {
      console.warn('⚠️ Contract addresses missing in contract-addresses.json');
      return;
    }
    
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    projectRegistry = new ethers.Contract(contractAddresses.ProjectRegistry, ProjectRegistryABI, wallet);
    carbonCredit = new ethers.Contract(contractAddresses.CarbonCreditToken, CarbonCreditABI, wallet);
    
    console.log('✅ Blockchain contracts initialized successfully');
  } catch (error) {
    console.error('❌ Wallet initialization error:', error.message);
  }
}

// Get blockchain status
router.get('/status', async (req, res) => {
  try {
    if (!provider) {
      return res.status(503).json({
        error: 'Blockchain service not initialized',
        message: 'Provider not available'
      });
    }
    
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();
    const gasPrice = await provider.getGasPrice();
    
    let walletBalance = 'N/A';
    if (wallet) {
      const balance = await wallet.getBalance();
      walletBalance = ethers.utils.formatEther(balance);
    }

    res.json({
      network: {
        name: network.name,
        chainId: network.chainId
      },
      blockNumber,
      gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
      walletBalance,
      walletConnected: wallet !== null,
      contracts: contractAddresses
    });
  } catch (error) {
    console.error('Blockchain status error:', error);
    res.status(500).json({ error: 'Failed to get blockchain status' });
  }
});

// Register new project on blockchain
router.post('/register-project', async (req, res) => {
  try {
    const { name, location, area, ipfsHash } = req.body;

    if (!name || !location || !area || !ipfsHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tx = await projectRegistry.registerProject(name, location, area, ipfsHash);
    const receipt = await tx.wait();

    // Get project ID from event
    const event = receipt.events.find(e => e.event === 'ProjectRegistered');
    const projectId = event.args.projectId.toString();

    res.json({
      success: true,
      projectId,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });
  } catch (error) {
    console.error('Project registration error:', error);
    res.status(500).json({ error: 'Failed to register project on blockchain' });
  }
});

// Get project from blockchain
router.get('/project/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await projectRegistry.getProject(id);

    res.json({
      id: project.id.toString(),
      name: project.name,
      location: project.location,
      area: project.area.toString(),
      ipfsHash: project.ipfsHash,
      owner: project.owner,
      verified: project.verified,
      createdAt: new Date(project.createdAt.toNumber() * 1000)
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project from blockchain' });
  }
});

// Verify project
router.post('/verify-project/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await projectRegistry.verifyProject(id);
    const receipt = await tx.wait();

    res.json({
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    });
  } catch (error) {
    console.error('Project verification error:', error);
    res.status(500).json({ error: 'Failed to verify project' });
  }
});

// Mint carbon credits
router.post('/mint-credits', async (req, res) => {
  try {
    const { to, amount, projectId, batchId } = req.body;

    if (!to || !amount || !projectId || !batchId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tx = await carbonCredit.mint(to, ethers.utils.parseEther(amount), projectId, batchId);
    const receipt = await tx.wait();

    res.json({
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    });
  } catch (error) {
    console.error('Credit minting error:', error);
    res.status(500).json({ error: 'Failed to mint carbon credits' });
  }
});

// Get carbon credit balance
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await carbonCredit.balanceOf(address);

    res.json({
      address,
      balance: ethers.utils.formatEther(balance),
      balanceWei: balance.toString()
    });
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Transfer carbon credits
router.post('/transfer', async (req, res) => {
  try {
    const { to, amount } = req.body;

    if (!to || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tx = await carbonCredit.transfer(to, ethers.utils.parseEther(amount));
    const receipt = await tx.wait();

    res.json({
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Failed to transfer credits' });
  }
});

// Retire carbon credits
router.post('/retire', async (req, res) => {
  try {
    const { amount, reason } = req.body;

    if (!amount || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tx = await carbonCredit.retire(ethers.utils.parseEther(amount), reason);
    const receipt = await tx.wait();

    res.json({
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      retiredAmount: amount,
      reason
    });
  } catch (error) {
    console.error('Retirement error:', error);
    res.status(500).json({ error: 'Failed to retire credits' });
  }
});

// Get transaction details
router.get('/transaction/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const tx = await provider.getTransaction(hash);
    const receipt = await provider.getTransactionReceipt(hash);

    res.json({
      transaction: {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.utils.formatEther(tx.value),
        gasLimit: tx.gasLimit.toString(),
        gasPrice: ethers.utils.formatUnits(tx.gasPrice, 'gwei'),
        nonce: tx.nonce,
        blockNumber: tx.blockNumber
      },
      receipt: {
        status: receipt.status,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: ethers.utils.formatUnits(receipt.effectiveGasPrice, 'gwei'),
        logs: receipt.logs.length
      }
    });
  } catch (error) {
    console.error('Transaction lookup error:', error);
    res.status(500).json({ error: 'Failed to get transaction details' });
  }
});

module.exports = router;
