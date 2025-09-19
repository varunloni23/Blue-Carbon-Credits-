const hre = require("hardhat");
const { ethers } = hre;
const fs = require('fs');
const path = require('path');

async function deployGeoDataRegistry() {
    console.log('🗺️  Deploying GeoDataRegistry to Amoy Testnet...\n');
    
    try {
        const [deployer] = await ethers.getSigners();
        
        console.log('📋 Deployment Account:');
        console.log(`Address: ${deployer.address}`);
        console.log(`Balance: ${ethers.utils.formatEther(await deployer.getBalance())} MATIC\n`);
        
        // Deploy GeoDataRegistry
        console.log('🏗️  Deploying GeoDataRegistry...');
        
        const GeoDataRegistry = await ethers.getContractFactory("GeoDataRegistry");
        const geoDataRegistry = await GeoDataRegistry.deploy();
        await geoDataRegistry.deployed();
        console.log(`✅ GeoDataRegistry: ${geoDataRegistry.address}`);
        
        // Setup initial permissions
        console.log('🔐 Setting up initial permissions...');
        
        // Grant admin roles to deployer
        const VERIFIER_ROLE = await geoDataRegistry.VERIFIER_ROLE();
        const DATA_SUBMITTER_ROLE = await geoDataRegistry.DATA_SUBMITTER_ROLE();
        
        await geoDataRegistry.grantRole(VERIFIER_ROLE, deployer.address);
        await geoDataRegistry.grantRole(DATA_SUBMITTER_ROLE, deployer.address);
        
        console.log('✅ Permissions configured\n');
        
        // Load existing contract addresses
        const configPath = path.join(__dirname, '../../shared/contract-addresses.json');
        let deploymentInfo;
        
        if (fs.existsSync(configPath)) {
            deploymentInfo = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            console.log('📄 Loaded existing contract addresses');
        } else {
            deploymentInfo = {
                network: "amoy",
                chainId: 80002,
                deployedAt: new Date().toISOString(),
                deployer: deployer.address,
                contracts: {}
            };
        }
        
        // Add GeoDataRegistry to existing contracts
        deploymentInfo.contracts.GeoDataRegistry = geoDataRegistry.address;
        deploymentInfo.lastUpdated = new Date().toISOString();
        
        // Save updated config
        fs.writeFileSync(configPath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`📄 Contract addresses updated: ${configPath}`);
        
        console.log('\n🎉 GeoDataRegistry deployment completed successfully!');
        console.log(`📍 Contract Address: ${geoDataRegistry.address}`);
        console.log('🗺️  Ready for GPS coordinate storage on blockchain!');
        
        // Display current contract list
        console.log('\n📋 All deployed contracts:');
        Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
            console.log(`   ${name}: ${address}`);
        });
        
        return {
            address: geoDataRegistry.address,
            deploymentInfo
        };
        
    } catch (error) {
        console.error('❌ GeoDataRegistry deployment failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    deployGeoDataRegistry()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { deployGeoDataRegistry };
