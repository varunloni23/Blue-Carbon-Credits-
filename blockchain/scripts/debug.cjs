const hre = require("hardhat");

async function debug() {
    console.log('Available properties in hre:');
    console.log(Object.keys(hre));
    
    console.log('\nChecking ethers:');
    console.log('hre.ethers:', typeof hre.ethers);
    
    if (hre.ethers) {
        console.log('hre.ethers methods:', Object.keys(hre.ethers));
    } else {
        console.log('ethers not found, trying hardhat/ethers...');
        try {
            const { ethers } = require('@nomicfoundation/hardhat-ethers');
            console.log('Found ethers from hardhat-ethers package');
        } catch (error) {
            console.log('Error loading ethers:', error.message);
        }
    }
}

debug().catch(console.error);
