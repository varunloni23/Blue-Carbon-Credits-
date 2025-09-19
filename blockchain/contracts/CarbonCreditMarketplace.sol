// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ICarbonCreditToken {
    function getBatch(uint256 _batchId) external view returns (
        uint256 projectId,
        uint256 amount,
        uint256 vintage,
        string memory verificationStandard,
        string memory ipfsMetadata,
        bool isRetired,
        uint256 createdAt,
        address originalOwner
    );
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IProjectRegistry {
    function getProject(uint256 _projectId) external view returns (
        uint256 id,
        string memory name,
        string memory description,
        uint256 ecosystemType,
        string memory location,
        uint256 areaInHectares,
        address projectOwner,
        address[] memory communityWallets,
        address[] memory verifiers,
        uint256 status,
        uint256 createdAt,
        uint256 approvedAt,
        string memory ipfsHashMetadata,
        uint256 estimatedCarbonCredits,
        uint256 totalCarbonCredits,
        bool isActive
    );
}

interface IPaymentDistributor {
    function recordSaleAndDistribute(
        uint256 _projectId,
        uint256 _batchId,
        uint256 _amount,
        uint256 _price,
        address _buyer,
        address _seller
    ) external payable;
}

/**
 * @title CarbonCreditMarketplace
 * @dev Marketplace for buying and selling carbon credits with automated payment distribution
 */
contract CarbonCreditMarketplace is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    
    ICarbonCreditToken public carbonCreditToken;
    IProjectRegistry public projectRegistry;
    IPaymentDistributor public paymentDistributor;
    
    uint256 private _listingIdCounter;
    
    struct Listing {
        uint256 id;
        uint256 batchId;
        uint256 projectId;
        address seller;
        uint256 amount; // Number of credits
        uint256 pricePerCredit; // Price in wei per credit
        uint256 totalPrice; // Total price in wei
        bool isActive;
        uint256 createdAt;
        uint256 expiresAt;
        string description;
        uint256 vintage;
        string verificationStandard;
        string projectName;
        string projectLocation;
    }
    
    struct Sale {
        uint256 listingId;
        uint256 batchId;
        uint256 projectId;
        address seller;
        address buyer;
        uint256 amount;
        uint256 pricePerCredit;
        uint256 totalPrice;
        uint256 timestamp;
        string buyerReason; // Why the buyer is purchasing (offset, investment, etc.)
    }
    
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) public sellerListings;
    mapping(address => uint256[]) public buyerPurchases;
    mapping(uint256 => Sale[]) public batchSales;
    
    uint256 public platformFeePercentage = 250; // 2.5% in basis points (10000 = 100%)
    address public feeRecipient;
    uint256 public totalVolumeTraded;
    uint256 public totalFeesCollected;
    
    // Marketplace statistics
    mapping(uint256 => uint256) public projectTotalSales; // projectId => total amount sold
    mapping(uint256 => uint256) public projectTotalRevenue; // projectId => total revenue
    mapping(address => uint256) public userTotalPurchases; // buyer => total credits purchased
    mapping(address => uint256) public userTotalSales; // seller => total credits sold
    
    event ListingCreated(
        uint256 indexed listingId,
        uint256 indexed batchId,
        uint256 indexed projectId,
        address seller,
        uint256 amount,
        uint256 pricePerCredit
    );
    
    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller
    );
    
    event CreditsPurchased(
        uint256 indexed listingId,
        uint256 indexed batchId,
        uint256 indexed projectId,
        address seller,
        address buyer,
        uint256 amount,
        uint256 totalPrice
    );
    
    event PriceUpdated(
        uint256 indexed listingId,
        uint256 oldPrice,
        uint256 newPrice
    );
    
    event PlatformFeeUpdated(
        uint256 oldFee,
        uint256 newFee
    );
    
    modifier validListing(uint256 _listingId) {
        require(_listingId > 0 && _listingId <= _listingIdCounter, "Invalid listing ID");
        require(listings[_listingId].isActive, "Listing is not active");
        require(block.timestamp <= listings[_listingId].expiresAt, "Listing has expired");
        _;
    }
    
    modifier onlySeller(uint256 _listingId) {
        require(listings[_listingId].seller == msg.sender, "Not the seller");
        _;
    }
    
    constructor(
        address _carbonCreditToken,
        address _projectRegistry,
        address _paymentDistributor,
        address _feeRecipient
    ) {
        require(_carbonCreditToken != address(0), "Invalid carbon credit token address");
        require(_projectRegistry != address(0), "Invalid project registry address");
        require(_paymentDistributor != address(0), "Invalid payment distributor address");
        require(_feeRecipient != address(0), "Invalid fee recipient address");
        
        carbonCreditToken = ICarbonCreditToken(_carbonCreditToken);
        projectRegistry = IProjectRegistry(_projectRegistry);
        paymentDistributor = IPaymentDistributor(_paymentDistributor);
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Create a new listing for carbon credits
     */
    function createListing(
        uint256 _batchId,
        uint256 _amount,
        uint256 _pricePerCredit,
        uint256 _duration, // Duration in seconds
        string memory _description
    ) external nonReentrant returns (uint256) {
        require(_amount > 0, "Amount must be greater than 0");
        require(_pricePerCredit > 0, "Price must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        require(_duration <= 90 days, "Duration cannot exceed 90 days");
        
        // Get batch information
        (
            uint256 projectId,
            uint256 batchAmount,
            uint256 vintage,
            string memory verificationStandard,
            ,
            bool isRetired,
            ,
            address originalOwner
        ) = carbonCreditToken.getBatch(_batchId);
        
        require(!isRetired, "Cannot list retired credits");
        require(_amount <= batchAmount, "Amount exceeds batch size");
        
        // Get project information
        (
            ,
            string memory projectName,
            ,
            ,
            string memory projectLocation,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            
        ) = projectRegistry.getProject(projectId);
        
        // Verify seller has enough balance
        uint256 tokenAmount = _amount * 10**18; // Assuming 18 decimals
        require(carbonCreditToken.balanceOf(msg.sender) >= tokenAmount, "Insufficient balance");
        
        _listingIdCounter++;
        uint256 newListingId = _listingIdCounter;
        
        uint256 totalPrice = _amount * _pricePerCredit;
        
        Listing storage newListing = listings[newListingId];
        newListing.id = newListingId;
        newListing.batchId = _batchId;
        newListing.projectId = projectId;
        newListing.seller = msg.sender;
        newListing.amount = _amount;
        newListing.pricePerCredit = _pricePerCredit;
        newListing.totalPrice = totalPrice;
        newListing.isActive = true;
        newListing.createdAt = block.timestamp;
        newListing.expiresAt = block.timestamp + _duration;
        newListing.description = _description;
        newListing.vintage = vintage;
        newListing.verificationStandard = verificationStandard;
        newListing.projectName = projectName;
        newListing.projectLocation = projectLocation;
        
        sellerListings[msg.sender].push(newListingId);
        
        emit ListingCreated(
            newListingId,
            _batchId,
            projectId,
            msg.sender,
            _amount,
            _pricePerCredit
        );
        
        return newListingId;
    }
    
    /**
     * @dev Purchase carbon credits from a listing
     */
    function purchaseCredits(
        uint256 _listingId,
        uint256 _amount,
        string memory _reason
    ) external payable validListing(_listingId) nonReentrant {
        Listing storage listing = listings[_listingId];
        require(_amount > 0 && _amount <= listing.amount, "Invalid amount");
        require(msg.sender != listing.seller, "Cannot buy your own listing");
        
        uint256 totalCost = _amount * listing.pricePerCredit;
        require(msg.value >= totalCost, "Insufficient payment");
        
        // Calculate fees
        uint256 platformFee = (totalCost * platformFeePercentage) / 10000;
        uint256 sellerAmount = totalCost - platformFee;
        
        // Transfer carbon credits to buyer
        uint256 tokenAmount = _amount * 10**18;
        require(
            carbonCreditToken.transferFrom(listing.seller, msg.sender, tokenAmount),
            "Token transfer failed"
        );
        
        // Record the sale
        Sale memory newSale = Sale({
            listingId: _listingId,
            batchId: listing.batchId,
            projectId: listing.projectId,
            seller: listing.seller,
            buyer: msg.sender,
            amount: _amount,
            pricePerCredit: listing.pricePerCredit,
            totalPrice: totalCost,
            timestamp: block.timestamp,
            buyerReason: _reason
        });
        
        batchSales[listing.batchId].push(newSale);
        buyerPurchases[msg.sender].push(_listingId);
        
        // Update statistics
        projectTotalSales[listing.projectId] += _amount;
        projectTotalRevenue[listing.projectId] += totalCost;
        userTotalPurchases[msg.sender] += _amount;
        userTotalSales[listing.seller] += _amount;
        totalVolumeTraded += _amount;
        totalFeesCollected += platformFee;
        
        // Update listing
        listing.amount -= _amount;
        if (listing.amount == 0) {
            listing.isActive = false;
        }
        
        // Distribute payments
        if (sellerAmount > 0) {
            // Trigger automated payment distribution
            paymentDistributor.recordSaleAndDistribute{value: sellerAmount}(
                listing.projectId,
                listing.batchId,
                _amount,
                sellerAmount,
                msg.sender,
                listing.seller
            );
        }
        
        // Send platform fee
        if (platformFee > 0) {
            payable(feeRecipient).transfer(platformFee);
        }
        
        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        emit CreditsPurchased(
            _listingId,
            listing.batchId,
            listing.projectId,
            listing.seller,
            msg.sender,
            _amount,
            totalCost
        );
    }
    
    /**
     * @dev Cancel a listing
     */
    function cancelListing(uint256 _listingId) 
        external 
        validListing(_listingId) 
        onlySeller(_listingId) 
    {
        listings[_listingId].isActive = false;
        
        emit ListingCancelled(_listingId, msg.sender);
    }
    
    /**
     * @dev Update listing price
     */
    function updatePrice(uint256 _listingId, uint256 _newPricePerCredit)
        external
        validListing(_listingId)
        onlySeller(_listingId)
    {
        require(_newPricePerCredit > 0, "Price must be greater than 0");
        
        Listing storage listing = listings[_listingId];
        uint256 oldPrice = listing.pricePerCredit;
        listing.pricePerCredit = _newPricePerCredit;
        listing.totalPrice = listing.amount * _newPricePerCredit;
        
        emit PriceUpdated(_listingId, oldPrice, _newPricePerCredit);
    }
    
    /**
     * @dev Get listing details
     */
    function getListing(uint256 _listingId) external view returns (Listing memory) {
        require(_listingId > 0 && _listingId <= _listingIdCounter, "Invalid listing ID");
        return listings[_listingId];
    }
    
    /**
     * @dev Get active listings for a project
     */
    function getProjectListings(uint256 _projectId) external view returns (uint256[] memory) {
        uint256[] memory allListings = new uint256[](_listingIdCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= _listingIdCounter; i++) {
            if (listings[i].projectId == _projectId && 
                listings[i].isActive && 
                block.timestamp <= listings[i].expiresAt) {
                allListings[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 j = 0; j < count; j++) {
            result[j] = allListings[j];
        }
        
        return result;
    }
    
    /**
     * @dev Get all active listings
     */
    function getActiveListings(uint256 _limit, uint256 _offset) external view returns (uint256[] memory) {
        require(_limit > 0 && _limit <= 100, "Invalid limit");
        
        uint256[] memory activeListings = new uint256[](_limit);
        uint256 count = 0;
        uint256 currentOffset = 0;
        
        for (uint256 i = _listingIdCounter; i > 0 && count < _limit; i--) {
            if (listings[i].isActive && block.timestamp <= listings[i].expiresAt) {
                if (currentOffset >= _offset) {
                    activeListings[count] = i;
                    count++;
                }
                currentOffset++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 j = 0; j < count; j++) {
            result[j] = activeListings[j];
        }
        
        return result;
    }
    
    /**
     * @dev Get sales history for a batch
     */
    function getBatchSales(uint256 _batchId) external view returns (Sale[] memory) {
        return batchSales[_batchId];
    }
    
    /**
     * @dev Get marketplace statistics
     */
    function getMarketplaceStats() external view returns (
        uint256 totalListings,
        uint256 volume,
        uint256 fees,
        uint256 activeListingsCount
    ) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= _listingIdCounter; i++) {
            if (listings[i].isActive && block.timestamp <= listings[i].expiresAt) {
                activeCount++;
            }
        }
        
        return (
            _listingIdCounter,
            totalVolumeTraded,
            totalFeesCollected,
            activeCount
        );
    }
    
    /**
     * @dev Update platform fee (only owner)
     */
    function setPlatformFee(uint256 _newFeePercentage) external onlyOwner {
        require(_newFeePercentage <= 1000, "Fee cannot exceed 10%"); // Max 10%
        
        uint256 oldFee = platformFeePercentage;
        platformFeePercentage = _newFeePercentage;
        
        emit PlatformFeeUpdated(oldFee, _newFeePercentage);
    }
    
    /**
     * @dev Update fee recipient (only owner)
     */
    function setFeeRecipient(address _newFeeRecipient) external onlyOwner {
        require(_newFeeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _newFeeRecipient;
    }
    
    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
