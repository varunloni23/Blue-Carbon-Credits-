import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Contract addresses from deployment
const CONTRACT_ADDRESSES = {
  ProjectRegistry: '0x331A9336B7855E32B46F78053a963dc7FB6e3281',
  CarbonCreditToken: '0x50DB160bb4dfA789D600b5Be7eD80f66993b7620',
  UniqueCarbonCreditNFT: '0x8cB6Db9a056D2C9cEaD3860B2035ed0FEDaBE2Db',
  PaymentDistributor: '0xC69d14B24D6330fBA0a7527fc0da64199E038a6f',
  VerificationOracle: '0x0313771d7FB6A6460D7144eC660E2949eEdd515e'
};

// Contract ABIs (simplified for key functions)
const PROJECT_REGISTRY_ABI = [
  "function registerProject(string title, string description, string ecosystem, uint256 area, int256 lat, int256 lng, uint256 carbonEstimate) external returns (uint256)",
  "function getProject(uint256 projectId) external view returns (tuple(uint256 id, string title, string description, address owner, string ecosystem, uint256 area, int256 lat, int256 lng, uint256 carbonEstimate, bool verified, uint256 timestamp))",
  "function getProjectCount() external view returns (uint256)",
  "function verifyProject(uint256 projectId) external",
  "event ProjectRegistered(uint256 indexed projectId, address indexed owner, string title)"
];

const CARBON_CREDIT_ABI = [
  "function mint(address to, uint256 amount, uint256 projectId) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function totalSupply() external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const BlockchainIntegration = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    ecosystem: '',
    area: '',
    lat: '',
    lng: '',
    carbonEstimate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carbonBalance, setCarbonBalance] = useState('0');
  const [totalProjects, setTotalProjects] = useState('0');

  // Initialize blockchain connection
  useEffect(() => {
    checkConnection();
  }, []);

  // Load user data when connected
  useEffect(() => {
    if (account && contracts.CarbonCreditToken) {
      loadUserData();
    }
  }, [account, contracts]);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask not detected. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Check if we're on the correct network (Polygon Amoy)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0x13882') { // Polygon Amoy testnet chain ID
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13882' }]
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            // Chain not added to MetaMask, add it
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x13882',
                chainName: 'Polygon Amoy Testnet',
                nativeCurrency: {
                  name: 'POL',
                  symbol: 'POL',
                  decimals: 18
                },
                rpcUrls: ['https://rpc-amoy.polygon.technology/'],
                blockExplorerUrls: ['https://amoy.polygonscan.com/']
              }]
            });
          } else {
            throw switchError;
          }
        }
      }

      // Set up provider and signer
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);

      // Initialize contracts
      const contractInstances = {
        ProjectRegistry: new ethers.Contract(
          CONTRACT_ADDRESSES.ProjectRegistry,
          PROJECT_REGISTRY_ABI,
          web3Signer
        ),
        CarbonCreditToken: new ethers.Contract(
          CONTRACT_ADDRESSES.CarbonCreditToken,
          CARBON_CREDIT_ABI,
          web3Signer
        )
      };

      setContracts(contractInstances);
      setSuccess('Successfully connected to Polygon Amoy testnet!');

    } catch (error) {
      console.error('Connection error:', error);
      setError(`Failed to connect: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const loadUserData = async () => {
    try {
      // Get carbon credit balance
      const balance = await contracts.CarbonCreditToken.balanceOf(account);
      setCarbonBalance(ethers.utils.formatEther(balance));

      // Get total project count
      const count = await contracts.ProjectRegistry.getProjectCount();
      setTotalProjects(count.toString());

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProjectData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const registerProject = async (e) => {
    e.preventDefault();
    
    if (!signer || !contracts.ProjectRegistry) {
      setError('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate inputs
      const { title, description, ecosystem, area, lat, lng, carbonEstimate } = projectData;
      
      if (!title || !description || !ecosystem || !area || !lat || !lng || !carbonEstimate) {
        throw new Error('Please fill in all fields');
      }

      // Convert coordinates to fixed-point integers (multiply by 1e6 for precision)
      const latInt = Math.round(parseFloat(lat) * 1e6);
      const lngInt = Math.round(parseFloat(lng) * 1e6);
      const areaUint = ethers.utils.parseUnits(area, 0);
      const carbonUint = ethers.utils.parseUnits(carbonEstimate, 0);

      console.log('Registering project with params:', {
        title,
        description,
        ecosystem,
        area: areaUint.toString(),
        lat: latInt,
        lng: lngInt,
        carbonEstimate: carbonUint.toString()
      });

      // Call smart contract
      const tx = await contracts.ProjectRegistry.registerProject(
        title,
        description,
        ecosystem,
        areaUint,
        latInt,
        lngInt,
        carbonUint
      );

      setSuccess(`Transaction submitted! Hash: ${tx.hash}`);
      console.log('Transaction hash:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Extract project ID from events
      const projectRegisteredEvent = receipt.events?.find(
        event => event.event === 'ProjectRegistered'
      );
      
      if (projectRegisteredEvent) {
        const projectId = projectRegisteredEvent.args.projectId.toString();
        setSuccess(`✅ Project registered successfully! Project ID: ${projectId}. Transaction: ${tx.hash}`);
      } else {
        setSuccess(`✅ Project registered successfully! Transaction: ${tx.hash}`);
      }

      // Reset form
      setProjectData({
        title: '',
        description: '',
        ecosystem: '',
        area: '',
        lat: '',
        lng: '',
        carbonEstimate: ''
      });

      // Reload user data
      await loadUserData();

    } catch (error) {
      console.error('Registration error:', error);
      setError(`Registration failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContracts({});
    setCarbonBalance('0');
    setTotalProjects('0');
    setSuccess(null);
    setError(null);
  };

  return (
    <div className="blockchain-integration">
      <div className="header">
        <h2>🔗 Blockchain Integration</h2>
        <p>Register your blue carbon projects directly on Polygon Amoy testnet</p>
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        {!account ? (
          <div className="wallet-connect">
            <h3>Connect Your Wallet</h3>
            <p>Connect to MetaMask to register projects on the blockchain</p>
            <button 
              onClick={connectWallet} 
              disabled={isConnecting}
              className="connect-btn"
            >
              {isConnecting ? '🔄 Connecting...' : '🦊 Connect MetaMask'}
            </button>
          </div>
        ) : (
          <div className="wallet-connected">
            <div className="account-info">
              <h3>✅ Wallet Connected</h3>
              <p><strong>Account:</strong> {account}</p>
              <p><strong>Network:</strong> Polygon Amoy Testnet</p>
              <p><strong>Carbon Credits:</strong> {carbonBalance} CC</p>
              <p><strong>Total Projects:</strong> {totalProjects}</p>
            </div>
            <button onClick={disconnectWallet} className="disconnect-btn">
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="message error">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="message success">
          {success}
        </div>
      )}

      {/* Project Registration Form */}
      {account && (
        <div className="project-form">
          <h3>Register New Project</h3>
          <form onSubmit={registerProject}>
            <div className="form-group">
              <label htmlFor="title">Project Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={projectData.title}
                onChange={handleInputChange}
                placeholder="Enter project title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={projectData.description}
                onChange={handleInputChange}
                placeholder="Describe your blue carbon project"
                rows={3}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ecosystem">Ecosystem Type</label>
                <select
                  id="ecosystem"
                  name="ecosystem"
                  value={projectData.ecosystem}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Ecosystem</option>
                  <option value="Mangroves">Mangroves</option>
                  <option value="Salt Marshes">Salt Marshes</option>
                  <option value="Seagrass Beds">Seagrass Beds</option>
                  <option value="Coastal Wetlands">Coastal Wetlands</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="area">Area (hectares)</label>
                <input
                  type="number"
                  id="area"
                  name="area"
                  value={projectData.area}
                  onChange={handleInputChange}
                  placeholder="100"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lat">Latitude</label>
                <input
                  type="number"
                  id="lat"
                  name="lat"
                  value={projectData.lat}
                  onChange={handleInputChange}
                  placeholder="22.3511"
                  step="0.000001"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lng">Longitude</label>
                <input
                  type="number"
                  id="lng"
                  name="lng"
                  value={projectData.lng}
                  onChange={handleInputChange}
                  placeholder="88.9870"
                  step="0.000001"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="carbonEstimate">Estimated Carbon Sequestration (tons CO2/year)</label>
              <input
                type="number"
                id="carbonEstimate"
                name="carbonEstimate"
                value={projectData.carbonEstimate}
                onChange={handleInputChange}
                placeholder="500"
                min="0"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="submit-btn"
            >
              {isSubmitting ? '🔄 Registering on Blockchain...' : '🚀 Register Project'}
            </button>
          </form>
        </div>
      )}

      {/* Contract Information */}
      <div className="contract-info">
        <h3>📋 Smart Contract Details</h3>
        <div className="contract-addresses">
          <p><strong>Project Registry:</strong> {CONTRACT_ADDRESSES.ProjectRegistry}</p>
          <p><strong>Carbon Credit Token:</strong> {CONTRACT_ADDRESSES.CarbonCreditToken}</p>
          <p><strong>Network:</strong> Polygon Amoy Testnet</p>
          <p><strong>Explorer:</strong> <a href="https://amoy.polygonscan.com" target="_blank" rel="noopener noreferrer">amoy.polygonscan.com</a></p>
        </div>
      </div>

      <style jsx>{`
        .blockchain-integration {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .header h2 {
          color: #0077be;
          font-size: 28px;
          margin-bottom: 10px;
        }

        .header p {
          color: #666;
          font-size: 16px;
        }

        .connection-status {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
          margin-bottom: 25px;
        }

        .wallet-connect {
          text-align: center;
        }

        .wallet-connect h3 {
          color: #333;
          margin-bottom: 10px;
        }

        .wallet-connect p {
          color: #666;
          margin-bottom: 20px;
        }

        .connect-btn {
          background: #ff6b35;
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }

        .connect-btn:hover:not(:disabled) {
          background: #e55a2b;
        }

        .connect-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .wallet-connected {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .account-info h3 {
          color: #28a745;
          margin-bottom: 15px;
        }

        .account-info p {
          margin: 5px 0;
          color: #555;
          font-size: 14px;
        }

        .disconnect-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .disconnect-btn:hover {
          background: #5a6268;
        }

        .message {
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .message.success {
          background: #d1edff;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .project-form {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
          margin-bottom: 25px;
        }

        .project-form h3 {
          color: #333;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e1e1e1;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #0077be;
        }

        .submit-btn {
          width: 100%;
          background: #0077be;
          color: white;
          border: none;
          padding: 15px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #005a8b;
        }

        .submit-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .contract-info {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 25px;
          border-left: 4px solid #0077be;
        }

        .contract-info h3 {
          color: #333;
          margin-bottom: 15px;
        }

        .contract-addresses p {
          margin: 8px 0;
          font-family: monospace;
          font-size: 13px;
          color: #555;
          word-break: break-all;
        }

        .contract-addresses a {
          color: #0077be;
          text-decoration: none;
        }

        .contract-addresses a:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }

          .wallet-connected {
            flex-direction: column;
            align-items: start;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default BlockchainIntegration;