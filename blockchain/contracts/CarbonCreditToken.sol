// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CarbonCreditToken
 * @dev ERC20 token for fungible carbon credits with batch tracking
 */
contract CarbonCreditToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    
    uint256 private _batchIdCounter;
    
    struct CreditBatch {
        uint256 projectId;
        uint256 amount;
        uint256 vintage; // Year of credit generation
        string verificationStandard;
        string ipfsMetadata;
        bool isRetired;
        uint256 createdAt;
        address originalOwner;
    }
    
    struct RetirementInfo {
        uint256 batchId;
        uint256 amount;
        string reason;
        address retiredBy;
        uint256 timestamp;
    }
    
    mapping(uint256 => CreditBatch) public creditBatches; // batchId => CreditBatch
    mapping(address => uint256[]) public ownerBatches; // owner => batchIds[]
    mapping(uint256 => uint256[]) public projectBatches; // projectId => batchIds[]
    mapping(uint256 => RetirementInfo[]) public batchRetirements; // batchId => RetirementInfo[]
    mapping(address => uint256) public totalRetiredCredits; // address => total retired amount
    
    uint256 public totalIssuedCredits;
    uint256 public totalRetiredCreditsGlobal;
    
    event CreditBatchMinted(
        uint256 indexed batchId,
        uint256 indexed projectId,
        uint256 amount,
        uint256 vintage,
        address indexed owner
    );
    
    event CreditsRetired(
        uint256 indexed batchId,
        uint256 amount,
        address indexed retiredBy,
        string reason
    );
    
    event BatchMetadataUpdated(
        uint256 indexed batchId,
        string newIpfsMetadata
    );
    
    modifier validBatchId(uint256 _batchId) {
        require(_batchId > 0 && _batchId <= _batchIdCounter, "Invalid batch ID");
        _;
    }
    
    modifier onlyBatchOwner(uint256 _batchId) {
        require(ownerOf(_batchId) == msg.sender, "Not batch owner");
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        // Initialize with 18 decimal places (standard for carbon credits)
    }
    
    /**
     * @dev Mint a new batch of carbon credits
     */
    function mintCreditBatch(
        uint256 _projectId,
        uint256 _amount,
        uint256 _vintage,
        string memory _verificationStandard,
        string memory _ipfsMetadata,
        address _to
    ) external onlyOwner returns (uint256) {
        require(_projectId > 0, "Invalid project ID");
        require(_amount > 0, "Amount must be greater than 0");
        require(_vintage > 0, "Invalid vintage year");
        require(_to != address(0), "Invalid recipient address");
        require(bytes(_verificationStandard).length > 0, "Verification standard required");
        
        _batchIdCounter++;
        uint256 newBatchId = _batchIdCounter;
        
        // Create batch record
        CreditBatch storage newBatch = creditBatches[newBatchId];
        newBatch.projectId = _projectId;
        newBatch.amount = _amount;
        newBatch.vintage = _vintage;
        newBatch.verificationStandard = _verificationStandard;
        newBatch.ipfsMetadata = _ipfsMetadata;
        newBatch.isRetired = false;
        newBatch.createdAt = block.timestamp;
        newBatch.originalOwner = _to;
        
        // Update tracking mappings
        ownerBatches[_to].push(newBatchId);
        projectBatches[_projectId].push(newBatchId);
        
        // Mint ERC20 tokens
        _mint(_to, _amount * 10**decimals());
        
        // Update global counters
        totalIssuedCredits += _amount;
        
        emit CreditBatchMinted(newBatchId, _projectId, _amount, _vintage, _to);
        
        return newBatchId;
    }
    
    /**
     * @dev Retire carbon credits permanently
     */
    function retireCredits(
        uint256 _batchId,
        uint256 _amount,
        string memory _reason
    ) external validBatchId(_batchId) nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(bytes(_reason).length > 0, "Retirement reason required");
        
        CreditBatch storage batch = creditBatches[_batchId];
        require(!batch.isRetired, "Batch already retired");
        
        uint256 tokenAmount = _amount * 10**decimals();
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient balance");
        
        // Burn the tokens
        _burn(msg.sender, tokenAmount);
        
        // Record retirement
        RetirementInfo memory retirement = RetirementInfo({
            batchId: _batchId,
            amount: _amount,
            reason: _reason,
            retiredBy: msg.sender,
            timestamp: block.timestamp
        });
        
        batchRetirements[_batchId].push(retirement);
        totalRetiredCredits[msg.sender] += _amount;
        totalRetiredCreditsGlobal += _amount;
        
        // Mark batch as retired if fully retired
        if (getTotalRetiredFromBatch(_batchId) >= batch.amount) {
            batch.isRetired = true;
        }
        
        emit CreditsRetired(_batchId, _amount, msg.sender, _reason);
    }
    
    /**
     * @dev Update batch metadata (IPFS hash)
     */
    function updateBatchMetadata(
        uint256 _batchId,
        string memory _newIpfsMetadata
    ) external onlyOwner validBatchId(_batchId) {
        require(bytes(_newIpfsMetadata).length > 0, "IPFS metadata cannot be empty");
        
        creditBatches[_batchId].ipfsMetadata = _newIpfsMetadata;
        
        emit BatchMetadataUpdated(_batchId, _newIpfsMetadata);
    }
    
    /**
     * @dev Get batch information
     */
    function getBatch(uint256 _batchId) external view validBatchId(_batchId) returns (CreditBatch memory) {
        return creditBatches[_batchId];
    }
    
    /**
     * @dev Get batches owned by an address
     */
    function getOwnerBatches(address _owner) external view returns (uint256[] memory) {
        return ownerBatches[_owner];
    }
    
    /**
     * @dev Get batches for a project
     */
    function getProjectBatches(uint256 _projectId) external view returns (uint256[] memory) {
        return projectBatches[_projectId];
    }
    
    /**
     * @dev Get retirement history for a batch
     */
    function getBatchRetirements(uint256 _batchId) external view validBatchId(_batchId) returns (RetirementInfo[] memory) {
        return batchRetirements[_batchId];
    }
    
    /**
     * @dev Get total retired credits from a specific batch
     */
    function getTotalRetiredFromBatch(uint256 _batchId) public view validBatchId(_batchId) returns (uint256) {
        RetirementInfo[] memory retirements = batchRetirements[_batchId];
        uint256 total = 0;
        
        for (uint256 i = 0; i < retirements.length; i++) {
            total += retirements[i].amount;
        }
        
        return total;
    }
    
    /**
     * @dev Get the owner of a batch (original minter)
     */
    function ownerOf(uint256 _batchId) public view validBatchId(_batchId) returns (address) {
        return creditBatches[_batchId].originalOwner;
    }
    
    /**
     * @dev Get total number of batches
     */
    function getTotalBatches() external view returns (uint256) {
        return _batchIdCounter;
    }
    
    /**
     * @dev Get global credit statistics
     */
    function getGlobalStats() external view returns (
        uint256 issued,
        uint256 retired,
        uint256 circulating
    ) {
        return (
            totalIssuedCredits,
            totalRetiredCreditsGlobal,
            totalIssuedCredits - totalRetiredCreditsGlobal
        );
    }
    
    /**
     * @dev Check if a batch exists
     */
    function batchExists(uint256 _batchId) external view returns (bool) {
        return _batchId > 0 && _batchId <= _batchIdCounter;
    }
    
    /**
     * @dev Pause token transfers (emergency function)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Override required by Solidity for multiple inheritance
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
