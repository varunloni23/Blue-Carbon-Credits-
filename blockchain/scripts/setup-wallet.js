import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

async function setupWallet() {
  console.log('🔐 Setting up wallet for Blue Carbon MRV System...\n');
  
  // Generate a new wallet for testing
  const wallet = ethers.Wallet.createRandom();
  
  console.log('✅ New Test Wallet Generated:');
  console.log('📍 Address:', wallet.address);
  console.log('🔑 Private Key:', wallet.privateKey);
  console.log('🌱 Mnemonic:', wallet.mnemonic.phrase);
  
  // Update .env file with the new private key
  const envPath = path.join(process.cwd(), '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Replace the placeholder private key
  envContent = envContent.replace(
    'PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000',
    `PRIVATE_KEY=${wallet.privateKey}`
  );
  
  // Set platform treasury to the same address for testing
  envContent = envContent.replace(
    'PLATFORM_TREASURY=0x0000000000000000000000000000000000000000',
    `PLATFORM_TREASURY=${wallet.address}`
  );
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Environment file updated with wallet credentials');
  
  // Create wallet info file
  const walletInfo = {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
    network: 'mumbai',
    createdAt: new Date().toISOString(),
    purpose: 'Blue Carbon MRV Testing'
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'wallet-info.json'),
    JSON.stringify(walletInfo, null, 2)
  );
  
  console.log('💾 Wallet information saved to wallet-info.json');
  
  // Setup test faucet instructions
  console.log('\n🚰 To get test MATIC for Mumbai testnet:');
  console.log('1. Visit: https://faucet.polygon.technology/');
  console.log('2. Select Mumbai Network');
  console.log('3. Enter your address:', wallet.address);
  console.log('4. Request test MATIC tokens');
  
  console.log('\n⚠️  IMPORTANT: This is a TEST wallet. Never use this private key on mainnet!');
  console.log('🔒 Keep your private key secure and never share it publicly.');
  
  return wallet;
}

// Run wallet setup
setupWallet()
  .then(() => {
    console.log('\n🎉 Wallet setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error setting up wallet:', error);
    process.exit(1);
  });
