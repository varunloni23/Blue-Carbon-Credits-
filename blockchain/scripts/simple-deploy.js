const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log('🚀 Starting Simple Deployment Test...');
    
    const [deployer] = await ethers.getSigners();
    console.log('📋 Deployer:', deployer.address);
    console.log('💰 Balance:', ethers.utils.formatEther(await deployer.getBalance()), 'ETH');
    
    // Deploy ProjectRegistry
    console.log('\n🏗️  Deploying ProjectRegistry...');
    const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
    const projectRegistry = await ProjectRegistry.deploy();
    await projectRegistry.deployed();
    console.log('✅ ProjectRegistry deployed to:', projectRegistry.address);
    
    // Test basic functionality
    console.log('\n🧪 Testing project creation...');
    const tx = await projectRegistry.createProject(
        "Test Mangrove Project",
        "Test Location",
        100,
        500,
        "22.25,-89.1",
        "Test Description",
        "Test Methodology"
    );
    
    const receipt = await tx.wait();
    const projectId = receipt.events[0].args.projectId;
    console.log('✅ Test project created with ID:', projectId.toString());
    
    const project = await projectRegistry.getProject(projectId);
    console.log('📋 Project name:', project.name);
    console.log('📍 Location:', project.location);
    
    console.log('\n🎉 Simple deployment test completed successfully!');
    
    return {
        projectRegistry: projectRegistry.address
    };
}

main()
    .then((result) => {
        console.log('\n📊 Deployed Contracts:');
        console.log('='.repeat(30));
        Object.entries(result).forEach(([name, address]) => {
            console.log(`${name}: ${address}`);
        });
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
