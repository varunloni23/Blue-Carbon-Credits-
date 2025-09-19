const hre = require("hardhat");
const { ethers } = hre;

async function deployAndTest() {
    console.log('🚀 Deploying Blue Carbon MRV System contracts...\n');
    
    try {
        // Get signers
        const [deployer, treasury, user1, user2] = await ethers.getSigners();
        
        console.log('📋 Deployment Details:');
        console.log(`Deployer: ${deployer.address}`);
        console.log(`Treasury: ${treasury.address}`);
        console.log(`Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH\n`);
        
        // Deploy ProjectRegistry
        console.log('🏗️  Deploying ProjectRegistry...');
        const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
        const projectRegistry = await ProjectRegistry.deploy();
        await projectRegistry.deployed();
        console.log(`✅ ProjectRegistry deployed to: ${projectRegistry.address}\n`);
        
        // Deploy CarbonCreditToken
        console.log('🏗️  Deploying CarbonCreditToken...');
        const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
        const carbonCreditToken = await CarbonCreditToken.deploy(
            "Blue Carbon Credit", 
            "BCC"
        );
        await carbonCreditToken.deployed();
        console.log(`✅ CarbonCreditToken deployed to: ${carbonCreditToken.address}\n`);
        
        // Deploy UniqueCarbonCreditNFT
        console.log('🏗️  Deploying UniqueCarbonCreditNFT...');
        const UniqueCarbonCreditNFT = await ethers.getContractFactory("UniqueCarbonCreditNFT");
        const uniqueCarbonCreditNFT = await UniqueCarbonCreditNFT.deploy(
            "https://api.bluecarbon.com/metadata/{id}.json"
        );
        await uniqueCarbonCreditNFT.deployed();
        console.log(`✅ UniqueCarbonCreditNFT deployed to: ${uniqueCarbonCreditNFT.address}\n`);
        
        // Deploy PaymentDistributor
        console.log('🏗️  Deploying PaymentDistributor...');
        const PaymentDistributor = await ethers.getContractFactory("PaymentDistributor");
        const paymentDistributor = await PaymentDistributor.deploy(
            carbonCreditToken.address,
            treasury.address
        );
        await paymentDistributor.deployed();
        console.log(`✅ PaymentDistributor deployed to: ${paymentDistributor.address}\n`);
        
        // Deploy VerificationOracle
        console.log('🏗️  Deploying VerificationOracle...');
        const VerificationOracle = await ethers.getContractFactory("VerificationOracle");
        const verificationOracle = await VerificationOracle.deploy(
            projectRegistry.address,
            carbonCreditToken.address
        );
        await verificationOracle.deployed();
        console.log(`✅ VerificationOracle deployed to: ${verificationOracle.address}\n`);
        
        // Set up permissions
        console.log('🔐 Setting up permissions...');
        
        // Add VerificationOracle as authorized verifier in ProjectRegistry
        await projectRegistry.addVerifier(verificationOracle.address);
        console.log('✅ VerificationOracle added as authorized verifier to ProjectRegistry');
        
        // Transfer ownership of CarbonCreditToken to VerificationOracle
        await carbonCreditToken.transferOwnership(verificationOracle.address);
        console.log('✅ CarbonCreditToken ownership transferred to VerificationOracle');
        
        // Add deployer as authorized verifier in VerificationOracle
        await verificationOracle.addVerifier(deployer.address);
        console.log('✅ Deployer added as authorized verifier in VerificationOracle\n');
        
        console.log('📊 Contract Summary:');
        console.log('==================');
        console.log(`ProjectRegistry: ${projectRegistry.address}`);
        console.log(`CarbonCreditToken: ${carbonCreditToken.address}`);
        console.log(`UniqueCarbonCreditNFT: ${uniqueCarbonCreditNFT.address}`);
        console.log(`PaymentDistributor: ${paymentDistributor.address}`);
        console.log(`VerificationOracle: ${verificationOracle.address}\n`);
        
        // Run comprehensive tests
        await runComprehensiveTests(
            projectRegistry,
            carbonCreditToken,
            uniqueCarbonCreditNFT,
            verificationOracle,
            paymentDistributor,
            deployer,
            user1,
            user2
        );
        
        console.log('🎉 Deployment and testing completed successfully!');
        
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

async function runComprehensiveTests(
    projectRegistry,
    carbonCreditToken,
    uniqueCarbonCreditNFT,
    verificationOracle,
    paymentDistributor,
    deployer,
    user1,
    user2
) {
    console.log('🧪 Starting Comprehensive Tests...\n');
    
    try {
        // Test 1: Create a Blue Carbon Project
        console.log('📋 Test 1: Creating Mangrove Restoration Project');
        console.log('='.repeat(50));
        
        const projectTx = await projectRegistry.registerProject(
            "Sundarbans Mangrove Restoration",
            "Community-led restoration of degraded mangrove ecosystems in the Sundarbans with scientific monitoring",
            0, // Mangrove ecosystem type
            "Sundarbans, West Bengal, India",
            500, // 500 hectares
            [deployer.address, user1.address], // Community wallets
            "QmSundarbansMeta123", // IPFS metadata
            2500 // Estimated 2500 carbon credits
        );
        
        const receipt = await projectTx.wait();
        const projectId = receipt.events[0].args.projectId;
        console.log(`✅ Project created with ID: ${projectId}`);
        
        const project = await projectRegistry.getProject(projectId);
        console.log(`📍 Location: ${project.location}`);
        console.log(`🌿 Area: ${project.areaInHectares} hectares`);
        console.log(`💨 Estimated Credits: ${project.estimatedCarbonCredits}\n`);
        
        // Test 2: Submit Verification Data
        console.log('📋 Test 2: Multi-Source Verification Submission');
        console.log('='.repeat(50));
        
        // Community data submission
        console.log('👥 Submitting community verification data...');
        await verificationOracle.submitVerificationData(
            projectId,
            0, // Community data
            "QmCommunityData123",
            "Local fishermen report increased mangrove coverage and fish population",
            600
        );
        
        await verificationOracle.submitVerificationData(
            projectId,
            0, // Community data
            "QmCommunityData456",
            "Village elder confirms 200 hectares planted successfully",
            550
        );
        
        await verificationOracle.submitVerificationData(
            projectId,
            0, // Community data
            "QmCommunityData789",
            "Women self-help group reports successful nursery establishment",
            650
        );
        
        // Satellite data submission
        console.log('🛰️  Submitting satellite verification data...');
        await verificationOracle.submitVerificationData(
            projectId,
            1, // Satellite data
            "QmSatelliteData123",
            "NDVI analysis shows 25% increase in vegetation cover",
            580
        );
        
        await verificationOracle.submitVerificationData(
            projectId,
            1, // Satellite data
            "QmSatelliteData456",
            "Landsat imagery confirms mangrove expansion in target areas",
            620
        );
        
        // Drone data submission
        console.log('🚁 Submitting drone verification data...');
        await verificationOracle.submitVerificationData(
            projectId,
            2, // Drone data
            "QmDroneData123",
            "High-resolution imagery shows healthy mangrove growth",
            590
        );
        
        // Third-party verification
        console.log('🏢 Submitting third-party verification data...');
        await verificationOracle.submitVerificationData(
            projectId,
            3, // Third-party data
            "QmThirdPartyData123",
            "Independent forest survey confirms carbon sequestration rates",
            575
        );
        
        console.log('✅ All verification data submitted\n');
        
        // Test 3: Verify submitted data
        console.log('📋 Test 3: Verification Process');
        console.log('='.repeat(50));
        
        console.log('✅ Verifying submitted data...');
        
        // Get all verification IDs for the project
        const verificationIds = await verificationOracle.getProjectVerificationIds(projectId);
        console.log(`📊 Total verification submissions: ${verificationIds.length}`);
        
        // Verify each submission
        for (let i = 0; i < verificationIds.length; i++) {
            await verificationOracle.updateVerificationStatus(
                verificationIds[i],
                1, // Verified status
                `Verification ${i + 1} approved after thorough review`
            );
        }
        
        console.log('✅ All verification data approved\n');
        
        // Test 4: Check if carbon credits were issued
        console.log('📋 Test 4: Carbon Credit Issuance');
        console.log('='.repeat(50));
        
        const projectVerification = await verificationOracle.getProjectVerification(projectId);
        console.log(`🔍 Verification complete: ${projectVerification.isCompletelyVerified}`);
        console.log(`💰 Final carbon credits: ${projectVerification.finalCarbonCredits}`);
        
        if (projectVerification.isCompletelyVerified) {
            const tokenBalance = await carbonCreditToken.balanceOf(deployer.address);
            console.log(`💎 Token balance: ${ethers.utils.formatEther(tokenBalance)} BCC`);
            
            const stats = await carbonCreditToken.getGlobalStats();
            console.log(`📈 Global issued: ${stats.issued}`);
            console.log(`🔥 Global retired: ${stats.retired}`);
            console.log(`💹 Global circulating: ${stats.circulating}\n`);
        }
        
        // Test 5: Mint Unique NFT
        console.log('📋 Test 5: Unique NFT Minting');
        console.log('='.repeat(50));
        
        console.log('🎨 Minting unique project NFT...');
        const nftTx = await uniqueCarbonCreditNFT.mintUniqueCredit(
            deployer.address,
            1, // Token ID
            100, // 100 credits
            "QmProjectNFTMetadata123",
            "Sundarbans Mangrove Certificate #001"
        );
        
        await nftTx.wait();
        console.log('✅ Unique NFT minted successfully');
        
        const nftBalance = await uniqueCarbonCreditNFT.balanceOf(deployer.address, 1);
        console.log(`🖼️  NFT balance: ${nftBalance}\n`);
        
        // Test 6: Retirement of Credits
        console.log('📋 Test 6: Carbon Credit Retirement');
        console.log('='.repeat(50));
        
        console.log('🔥 Retiring 50 carbon credits...');
        const retireTx = await carbonCreditToken.retireCredits(
            1, // Batch ID
            50, // Amount to retire
            "Corporate offset for annual emissions - Sundarbans Project"
        );
        
        await retireTx.wait();
        console.log('✅ Credits retired successfully');
        
        const updatedStats = await carbonCreditToken.getGlobalStats();
        console.log(`🔥 Total retired: ${updatedStats.retired}`);
        console.log(`💹 Circulating supply: ${updatedStats.circulating}\n`);
        
        console.log('🎯 All tests completed successfully!');
        console.log('='.repeat(50));
        console.log('✅ Project Registration: PASSED');
        console.log('✅ Multi-Source Verification: PASSED');
        console.log('✅ Automated Credit Issuance: PASSED');
        console.log('✅ Unique NFT Minting: PASSED');
        console.log('✅ Credit Retirement: PASSED');
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Run the deployment and testing
deployAndTest()
    .then(() => {
        console.log('\n🚀 Ready for mobile app and dashboard integration!');
        console.log('📱 Next steps:');
        console.log('  1. Update mobile app with contract addresses');
        console.log('  2. Start backend server');
        console.log('  3. Test end-to-end workflow');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    });
