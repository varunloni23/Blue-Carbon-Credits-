const hre = require("hardhat");
const { ethers } = hre;
const fs = require('fs');
const path = require('path');

async function deployToAmoy() {
    console.log('🚀 Deploying Blue Carbon MRV System to Amoy Testnet...\n');
    
    try {
        const [deployer] = await ethers.getSigners();
        
        console.log('📋 Deployment Account:');
        console.log(`Address: ${deployer.address}`);
        console.log(`Balance: ${ethers.utils.formatEther(await deployer.getBalance())} MATIC\n`);
        
        // Deploy all contracts
        console.log('🏗️  Deploying contracts...');
        
        const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
        const projectRegistry = await ProjectRegistry.deploy();
        await projectRegistry.deployed();
        console.log(`✅ ProjectRegistry: ${projectRegistry.address}`);
        
        const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
        const carbonCreditToken = await CarbonCreditToken.deploy("Blue Carbon Credit", "BCC");
        await carbonCreditToken.deployed();
        console.log(`✅ CarbonCreditToken: ${carbonCreditToken.address}`);
        
        const UniqueCarbonCreditNFT = await ethers.getContractFactory("UniqueCarbonCreditNFT");
        const uniqueCarbonCreditNFT = await UniqueCarbonCreditNFT.deploy(
            "https://api.bluecarbon.com/metadata/{id}.json"
        );
        await uniqueCarbonCreditNFT.deployed();
        console.log(`✅ UniqueCarbonCreditNFT: ${uniqueCarbonCreditNFT.address}`);
        
        const PaymentDistributor = await ethers.getContractFactory("PaymentDistributor");
        const paymentDistributor = await PaymentDistributor.deploy(
            carbonCreditToken.address,
            deployer.address
        );
        await paymentDistributor.deployed();
        console.log(`✅ PaymentDistributor: ${paymentDistributor.address}`);
        
        const VerificationOracle = await ethers.getContractFactory("VerificationOracle");
        const verificationOracle = await VerificationOracle.deploy(
            projectRegistry.address,
            carbonCreditToken.address
        );
        await verificationOracle.deployed();
        console.log(`✅ VerificationOracle: ${verificationOracle.address}\n`);
        
        // Setup permissions
        console.log('🔐 Setting up permissions...');
        await projectRegistry.addVerifier(verificationOracle.address);
        await carbonCreditToken.transferOwnership(verificationOracle.address);
        await verificationOracle.addVerifier(deployer.address);
        console.log('✅ Permissions configured\n');
        
        // Save deployment info
        const deploymentInfo = {
            network: "amoy",
            chainId: 80002,
            deployedAt: new Date().toISOString(),
            deployer: deployer.address,
            contracts: {
                ProjectRegistry: projectRegistry.address,
                CarbonCreditToken: carbonCreditToken.address,
                UniqueCarbonCreditNFT: uniqueCarbonCreditNFT.address,
                PaymentDistributor: paymentDistributor.address,
                VerificationOracle: verificationOracle.address
            }
        };
        
        // Save to shared config
        const configPath = path.join(__dirname, '../../shared/contract-addresses.json');
        fs.writeFileSync(configPath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`📄 Contract addresses saved to: ${configPath}`);
        
        console.log('\n🎉 Deployment completed successfully!');
        console.log('📱 Ready for mobile app integration');
        
        return deploymentInfo;
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    deployToAmoy()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { deployToAmoy };
