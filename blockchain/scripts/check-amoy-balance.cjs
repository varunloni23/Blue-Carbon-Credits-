const hre = require("hardhat");
const { ethers } = hre;

async function checkAmoyBalance() {
    console.log('🔍 Checking Amoy Testnet Balance...\n');
    
    try {
        // Connect to Amoy network
        const provider = new ethers.providers.JsonRpcProvider(
            process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology"
        );
        
        // Create wallet instance
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        console.log('📋 Account Details:');
        console.log(`Address: ${wallet.address}`);
        
        // Get balance
        const balance = await wallet.getBalance();
        const balanceInMatic = ethers.utils.formatEther(balance);
        
        console.log(`💰 Balance: ${balanceInMatic} MATIC`);
        
        // Check network
        const network = await provider.getNetwork();
        console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
        
        if (parseFloat(balanceInMatic) > 0) {
            console.log('\n✅ Great! You have MATIC balance on Amoy testnet.');
            console.log('🚀 Ready to deploy contracts to Amoy!');
        } else {
            console.log('\n⚠️ No MATIC balance found.');
            console.log('💡 Get test MATIC from: https://faucet.polygon.technology/');
        }
        
    } catch (error) {
        console.error('❌ Error checking balance:', error.message);
    }
}

checkAmoyBalance().catch(console.error);
