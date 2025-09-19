// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./CarbonCreditToken.sol";

/**
 * @title PaymentDistributor
 * @dev Handles automated payment distribution when carbon credits are sold
 */
contract PaymentDistributor is Ownable, ReentrancyGuard {
    
    struct PaymentSplit {
        address[] communityWallets;
        uint256[] communityPercentages; // Basis points (100 = 1%)
        address[] ngoWallets;
        uint256[] ngoPercentages;
        address[] verifierWallets;
        uint256[] verifierPercentages;
        address platformWallet;
        uint256 platformPercentage;
    }
    
    struct Sale {
        uint256 projectId;
        uint256 batchId;
        uint256 amount;
        uint256 price;
        address buyer;
        address seller;
        uint256 timestamp;
        bool isDistributed;
    }
    
    mapping(uint256 => PaymentSplit) public projectPaymentSplits; // projectId => PaymentSplit
    mapping(uint256 => Sale) public sales; // saleId => Sale
    mapping(address => uint256) public pendingWithdrawals;
    
    CarbonCreditToken public carbonCreditToken;
    address public platformTreasury;
    uint256 public defaultPlatformFee = 250; // 2.5% in basis points
    uint256 private _saleIdCounter;
    
    event PaymentSplitConfigured(
        uint256 indexed projectId,
        address[] communityWallets,
        uint256[] communityPercentages
    );
    
    event SaleRecorded(
        uint256 indexed saleId,
        uint256 indexed projectId,
        uint256 indexed batchId,
        uint256 amount,
        uint256 price,
        address buyer,
        address seller
    );
    
    event PaymentDistributed(
        uint256 indexed saleId,
        uint256 indexed projectId,
        uint256 totalAmount,
        uint256 timestamp
    );
    
    event FundsWithdrawn(
        address indexed recipient,
        uint256 amount
    );
    
    modifier validProjectId(uint256 _projectId) {
        require(_projectId > 0, "Invalid project ID");
        _;
    }
    
    constructor(
        address _carbonCreditToken,
        address _platformTreasury
    ) {
        require(_carbonCreditToken != address(0), "Invalid token address");
        require(_platformTreasury != address(0), "Invalid treasury address");
        
        carbonCreditToken = CarbonCreditToken(_carbonCreditToken);
        platformTreasury = _platformTreasury;
    }
    
    /**
     * @dev Configure payment split for a project
     */
    function configurePaymentSplit(
        uint256 _projectId,
        address[] memory _communityWallets,
        uint256[] memory _communityPercentages,
        address[] memory _ngoWallets,
        uint256[] memory _ngoPercentages,
        address[] memory _verifierWallets,
        uint256[] memory _verifierPercentages,
        address _platformWallet,
        uint256 _platformPercentage
    ) external onlyOwner validProjectId(_projectId) {
        require(_communityWallets.length == _communityPercentages.length, "Community arrays length mismatch");
        require(_ngoWallets.length == _ngoPercentages.length, "NGO arrays length mismatch");
        require(_verifierWallets.length == _verifierPercentages.length, "Verifier arrays length mismatch");
        
        // Validate total percentages don't exceed 100%
        uint256 totalPercentage = _platformPercentage;
        
        for (uint256 i = 0; i < _communityPercentages.length; i++) {
            totalPercentage += _communityPercentages[i];
        }
        for (uint256 i = 0; i < _ngoPercentages.length; i++) {
            totalPercentage += _ngoPercentages[i];
        }
        for (uint256 i = 0; i < _verifierPercentages.length; i++) {
            totalPercentage += _verifierPercentages[i];
        }
        
        require(totalPercentage <= 10000, "Total percentage exceeds 100%");
        
        PaymentSplit storage split = projectPaymentSplits[_projectId];
        split.communityWallets = _communityWallets;
        split.communityPercentages = _communityPercentages;
        split.ngoWallets = _ngoWallets;
        split.ngoPercentages = _ngoPercentages;
        split.verifierWallets = _verifierWallets;
        split.verifierPercentages = _verifierPercentages;
        split.platformWallet = _platformWallet != address(0) ? _platformWallet : platformTreasury;
        split.platformPercentage = _platformPercentage > 0 ? _platformPercentage : defaultPlatformFee;
        
        emit PaymentSplitConfigured(_projectId, _communityWallets, _communityPercentages);
    }
    
    /**
     * @dev Record a carbon credit sale and distribute payments
     */
    function recordSaleAndDistribute(
        uint256 _projectId,
        uint256 _batchId,
        uint256 _amount,
        uint256 _price,
        address _buyer,
        address _seller
    ) external payable nonReentrant validProjectId(_projectId) {
        require(_amount > 0, "Amount must be greater than 0");
        require(_price > 0, "Price must be greater than 0");
        require(_buyer != address(0), "Invalid buyer address");
        require(_seller != address(0), "Invalid seller address");
        require(msg.value >= _price, "Insufficient payment");
        
        _saleIdCounter++;
        uint256 saleId = _saleIdCounter;
        
        Sale storage sale = sales[saleId];
        sale.projectId = _projectId;
        sale.batchId = _batchId;
        sale.amount = _amount;
        sale.price = _price;
        sale.buyer = _buyer;
        sale.seller = _seller;
        sale.timestamp = block.timestamp;
        sale.isDistributed = false;
        
        emit SaleRecorded(saleId, _projectId, _batchId, _amount, _price, _buyer, _seller);
        
        // Distribute payments
        _distributePayment(saleId, _projectId, _price);
        
        // Refund excess payment
        if (msg.value > _price) {
            payable(msg.sender).transfer(msg.value - _price);
        }
    }
    
    /**
     * @dev Internal function to distribute payment according to configured splits
     */
    function _distributePayment(
        uint256 _saleId,
        uint256 _projectId,
        uint256 _totalAmount
    ) internal {
        PaymentSplit storage split = projectPaymentSplits[_projectId];
        
        // Distribute to community wallets
        for (uint256 i = 0; i < split.communityWallets.length; i++) {
            uint256 amount = (_totalAmount * split.communityPercentages[i]) / 10000;
            if (amount > 0) {
                pendingWithdrawals[split.communityWallets[i]] += amount;
            }
        }
        
        // Distribute to NGO wallets
        for (uint256 i = 0; i < split.ngoWallets.length; i++) {
            uint256 amount = (_totalAmount * split.ngoPercentages[i]) / 10000;
            if (amount > 0) {
                pendingWithdrawals[split.ngoWallets[i]] += amount;
            }
        }
        
        // Distribute to verifier wallets
        for (uint256 i = 0; i < split.verifierWallets.length; i++) {
            uint256 amount = (_totalAmount * split.verifierPercentages[i]) / 10000;
            if (amount > 0) {
                pendingWithdrawals[split.verifierWallets[i]] += amount;
            }
        }
        
        // Platform fee
        uint256 platformAmount = (_totalAmount * split.platformPercentage) / 10000;
        if (platformAmount > 0) {
            pendingWithdrawals[split.platformWallet] += platformAmount;
        }
        
        sales[_saleId].isDistributed = true;
        
        emit PaymentDistributed(_saleId, _projectId, _totalAmount, block.timestamp);
    }
    
    /**
     * @dev Withdraw pending payments
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        pendingWithdrawals[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Emergency withdraw for owner
     */
    function emergencyWithdraw(address _recipient, uint256 _amount) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount <= address(this).balance, "Insufficient balance");
        
        (bool success, ) = payable(_recipient).call{value: _amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @dev Update platform treasury address
     */
    function updatePlatformTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury address");
        platformTreasury = _newTreasury;
    }
    
    /**
     * @dev Update default platform fee
     */
    function updateDefaultPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%"); // Max 10%
        defaultPlatformFee = _newFee;
    }
    
    /**
     * @dev Get payment split configuration for a project
     */
    function getPaymentSplit(uint256 _projectId) external view returns (PaymentSplit memory) {
        return projectPaymentSplits[_projectId];
    }
    
    /**
     * @dev Get sale details
     */
    function getSale(uint256 _saleId) external view returns (Sale memory) {
        return sales[_saleId];
    }
    
    /**
     * @dev Get pending withdrawal amount for an address
     */
    function getPendingWithdrawal(address _address) external view returns (uint256) {
        return pendingWithdrawals[_address];
    }
    
    /**
     * @dev Get total sales count
     */
    function getTotalSales() external view returns (uint256) {
        return _saleIdCounter;
    }
    
    // Function to receive Ether
    receive() external payable {}
}
