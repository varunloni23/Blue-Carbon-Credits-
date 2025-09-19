const hre = require("hardhat");
const { ethers } = hre;

async function testWallet() {
    console.log('🔐 Testing Updated Wallet Configuration...\n');
    
    try {
        // Get the configured signer
        const [signer] = await ethers.getSigners();
        
        console.log('📋 Wallet Details:');
        console.log(`Address: ${signer.address}`);
        console.log(`Balance: ${ethers.utils.formatEther(await signer.getBalance())} ETH`);
        
        // Verify it matches your expected address
        const expectedAddress = "0xf792C63150999048CcA6A26D69e05c0F9605b6f3";
        
        if (signer.address.toLowerCase() === expectedAddress.toLowerCase()) {
            console.log('✅ Wallet address matches your main account!');
        } else {
            console.log('❌ Wallet address does not match. Expected:', expectedAddress);
        }
        
        console.log('\n🎉 Wallet configuration test completed!');
        
    } catch (error) {
        console.error('❌ Error testing wallet:', error.message);
    }
}

testWallet().catch(console.error);
