import { expect } from "chai";
import { ethers } from "hardhat";

describe("Blue Carbon MRV System", function () {
  let projectRegistry, carbonCreditToken, uniqueCarbonCreditNFT, paymentDistributor, verificationOracle;
  let owner, projectOwner, verifier, community1, community2, buyer;

  beforeEach(async function () {
    [owner, projectOwner, verifier, community1, community2, buyer] = await ethers.getSigners();

    // Deploy contracts
    const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
    projectRegistry = await ProjectRegistry.deploy();

    const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditToken");
    carbonCreditToken = await CarbonCreditToken.deploy("Blue Carbon Credit", "BCC");

    const UniqueCarbonCreditNFT = await ethers.getContractFactory("UniqueCarbonCreditNFT");
    uniqueCarbonCreditNFT = await UniqueCarbonCreditNFT.deploy("https://api.bluecarbonmrv.org/nft/{id}.json");

    const PaymentDistributor = await ethers.getContractFactory("PaymentDistributor");
    paymentDistributor = await PaymentDistributor.deploy(carbonCreditToken.address, owner.address);

    const VerificationOracle = await ethers.getContractFactory("VerificationOracle");
    verificationOracle = await VerificationOracle.deploy(projectRegistry.address, carbonCreditToken.address);

    // Setup permissions
    await projectRegistry.addVerifier(verificationOracle.address);
    await carbonCreditToken.addMinter(verificationOracle.address);
    await uniqueCarbonCreditNFT.addMinter(verificationOracle.address);
    await verificationOracle.addVerifier(verifier.address);
  });

  describe("ProjectRegistry", function () {
    it("Should register a new project", async function () {
      const tx = await projectRegistry.connect(projectOwner).registerProject(
        "Mangrove Restoration Project",
        "Restoring 100 hectares of mangrove forest",
        0, // EcosystemType.Mangrove
        "19.0760° N, 72.8777° E, Mumbai, India",
        100,
        [community1.address, community2.address],
        "QmTest123...ipfshash",
        1000
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "ProjectRegistered");
      
      expect(event.args.owner).to.equal(projectOwner.address);
      expect(event.args.name).to.equal("Mangrove Restoration Project");
      
      const project = await projectRegistry.getProject(1);
      expect(project.name).to.equal("Mangrove Restoration Project");
      expect(project.status).to.equal(0); // Pending
    });

    it("Should approve a project", async function () {
      await projectRegistry.connect(projectOwner).registerProject(
        "Test Project",
        "Description",
        0,
        "Location",
        100,
        [community1.address],
        "ipfshash",
        1000
      );

      await verificationOracle.connect(verifier).updateVerificationStatus(1, 1, "Approved after review");
      await projectRegistry.connect(verifier).approveProject(1);

      const project = await projectRegistry.getProject(1);
      expect(project.status).to.equal(1); // Approved
    });
  });

  describe("VerificationOracle", function () {
    beforeEach(async function () {
      await projectRegistry.connect(projectOwner).registerProject(
        "Test Project",
        "Description",
        0,
        "Location",
        100,
        [community1.address],
        "ipfshash",
        1000
      );
    });

    it("Should submit verification data", async function () {
      const tx = await verificationOracle.connect(community1).submitVerificationData(
        1,
        0, // DataSource.Community
        "QmCommunityData123",
        "Community collected restoration data",
        100
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "VerificationDataSubmitted");
      
      expect(event.args.projectId).to.equal(1);
      expect(event.args.source).to.equal(0);
      expect(event.args.submitter).to.equal(community1.address);
    });

    it("Should complete project verification and issue credits", async function () {
      // Submit required verification data
      await verificationOracle.connect(community1).submitVerificationData(1, 0, "QmCommunity1", "Data1", 100);
      await verificationOracle.connect(community2).submitVerificationData(1, 0, "QmCommunity2", "Data2", 100);
      await verificationOracle.connect(owner).submitVerificationData(1, 0, "QmCommunity3", "Data3", 100);
      
      await verificationOracle.connect(owner).submitVerificationData(1, 1, "QmSatellite1", "Satellite1", 95);
      await verificationOracle.connect(owner).submitVerificationData(1, 1, "QmSatellite2", "Satellite2", 105);
      
      await verificationOracle.connect(owner).submitVerificationData(1, 2, "QmDrone1", "Drone1", 98);
      
      await verificationOracle.connect(owner).submitVerificationData(1, 3, "QmThirdParty1", "ThirdParty1", 102);

      // Verify all data
      for (let i = 1; i <= 7; i++) {
        await verificationOracle.connect(verifier).updateVerificationStatus(i, 1, "Verified");
      }

      // Check if credits were issued
      const projectVerif = await verificationOracle.getProjectVerification(1);
      expect(projectVerif.isCompletelyVerified).to.be.true;
      expect(projectVerif.finalCarbonCredits).to.be.gt(0);

      // Check token balance
      const balance = await carbonCreditToken.balanceOf(projectOwner.address);
      expect(balance).to.be.gt(0);
    });
  });

  describe("CarbonCreditToken", function () {
    it("Should mint carbon credits", async function () {
      await carbonCreditToken.connect(owner).addMinter(owner.address);
      
      const tx = await carbonCreditToken.connect(owner).mintCreditBatch(
        1,
        100,
        Math.floor(Date.now() / 1000),
        "Blue Carbon Standard",
        "QmBatchMetadata",
        projectOwner.address
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "CreditsBatchMinted");
      
      expect(event.args.projectId).to.equal(1);
      expect(event.args.amount).to.equal(100);
      expect(event.args.recipient).to.equal(projectOwner.address);

      const balance = await carbonCreditToken.balanceOf(projectOwner.address);
      expect(balance).to.equal(ethers.utils.parseEther("100"));
    });

    it("Should retire carbon credits", async function () {
      await carbonCreditToken.connect(owner).addMinter(owner.address);
      await carbonCreditToken.connect(owner).mintCreditBatch(
        1, 100, Math.floor(Date.now() / 1000), "Standard", "metadata", projectOwner.address
      );

      const initialBalance = await carbonCreditToken.balanceOf(projectOwner.address);
      
      await carbonCreditToken.connect(projectOwner).retireCredits(1, 50, "Offsetting company emissions");

      const finalBalance = await carbonCreditToken.balanceOf(projectOwner.address);
      expect(finalBalance).to.equal(initialBalance.sub(ethers.utils.parseEther("50")));
    });
  });

  describe("PaymentDistributor", function () {
    beforeEach(async function () {
      // Configure payment split
      await paymentDistributor.connect(owner).configurePaymentSplit(
        1,
        [community1.address, community2.address],
        [3000, 2000], // 30% and 20%
        [owner.address],
        [2000], // 20%
        [verifier.address],
        [1500], // 15%
        owner.address,
        1500 // 15%
      );
    });

    it("Should distribute payment correctly", async function () {
      const salePrice = ethers.utils.parseEther("1");
      
      await paymentDistributor.connect(buyer).recordSaleAndDistribute(
        1, 1, 100, salePrice, buyer.address, projectOwner.address,
        { value: salePrice }
      );

      // Check pending withdrawals
      const community1Pending = await paymentDistributor.getPendingWithdrawal(community1.address);
      const community2Pending = await paymentDistributor.getPendingWithdrawal(community2.address);
      
      expect(community1Pending).to.equal(salePrice.mul(3000).div(10000)); // 30%
      expect(community2Pending).to.equal(salePrice.mul(2000).div(10000)); // 20%
    });

    it("Should allow withdrawal of pending payments", async function () {
      const salePrice = ethers.utils.parseEther("1");
      
      await paymentDistributor.connect(buyer).recordSaleAndDistribute(
        1, 1, 100, salePrice, buyer.address, projectOwner.address,
        { value: salePrice }
      );

      const initialBalance = await community1.getBalance();
      const pendingAmount = await paymentDistributor.getPendingWithdrawal(community1.address);
      
      await paymentDistributor.connect(community1).withdraw();
      
      const finalBalance = await community1.getBalance();
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe("Integration Test - Full Workflow", function () {
    it("Should complete full MRV workflow", async function () {
      // 1. Register project
      await projectRegistry.connect(projectOwner).registerProject(
        "Integrated Test Project",
        "Full workflow test",
        0, "Test Location", 100,
        [community1.address, community2.address],
        "ipfshash", 1000
      );

      // 2. Submit verification data
      await verificationOracle.connect(community1).submitVerificationData(1, 0, "QmC1", "Data1", 100);
      await verificationOracle.connect(community2).submitVerificationData(1, 0, "QmC2", "Data2", 100);
      await verificationOracle.connect(owner).submitVerificationData(1, 0, "QmC3", "Data3", 100);
      await verificationOracle.connect(owner).submitVerificationData(1, 1, "QmS1", "Sat1", 95);
      await verificationOracle.connect(owner).submitVerificationData(1, 1, "QmS2", "Sat2", 105);
      await verificationOracle.connect(owner).submitVerificationData(1, 2, "QmD1", "Drone1", 98);
      await verificationOracle.connect(owner).submitVerificationData(1, 3, "QmT1", "Third1", 102);

      // 3. Verify data
      for (let i = 1; i <= 7; i++) {
        await verificationOracle.connect(verifier).updateVerificationStatus(i, 1, "Verified");
      }

      // 4. Check credits were issued
      const balance = await carbonCreditToken.balanceOf(projectOwner.address);
      expect(balance).to.be.gt(0);

      // 5. Configure payment distribution
      await paymentDistributor.connect(owner).configurePaymentSplit(
        1,
        [community1.address, community2.address],
        [3000, 2000],
        [], [], [], [],
        owner.address, 1000
      );

      // 6. Record sale and distribution
      const salePrice = ethers.utils.parseEther("1");
      await paymentDistributor.connect(buyer).recordSaleAndDistribute(
        1, 1, 50, salePrice, buyer.address, projectOwner.address,
        { value: salePrice }
      );

      // 7. Verify payments were distributed
      const community1Pending = await paymentDistributor.getPendingWithdrawal(community1.address);
      expect(community1Pending).to.be.gt(0);

      console.log("Full MRV workflow completed successfully!");
    });
  });
});
