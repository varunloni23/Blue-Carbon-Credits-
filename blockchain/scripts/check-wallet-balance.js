async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Checking wallet balance for:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("Current balance:", ethers.utils.formatEther(balance), "MATIC");
  
  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    console.log("⚠️  Low balance! Need more MATIC for transactions");
    console.log("🚿 Get test MATIC from: https://faucet.polygon.technology/");
  } else {
    console.log("✅ Sufficient balance for transactions");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });