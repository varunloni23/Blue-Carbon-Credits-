// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title UniqueCarbonCreditNFT
 * @dev ERC1155 contract for unique, project-specific carbon credit NFTs
 */
contract UniqueCarbonCreditNFT is ERC1155, Ownable, ReentrancyGuard {
    
    struct UniqueCredit {
        uint256 projectId;
        uint256 creditAmount;
        string ipfsMetadata;
        string certificateName;
        bool isRetired;
        uint256 mintedAt;
        address originalMinter;
    }
    
    mapping(uint256 => UniqueCredit) public uniqueCredits; // tokenId => UniqueCredit
    mapping(uint256 => uint256[]) public projectTokens; // projectId => tokenIds[]
    mapping(address => uint256[]) public ownerTokens; // owner => tokenIds[]
    
    uint256 private _tokenIdCounter;
    
    event UniqueCreditMinted(
        uint256 indexed tokenId,
        uint256 indexed projectId,
        uint256 creditAmount,
        address indexed recipient,
        string certificateName
    );
    
    event UniqueCreditRetired(
        uint256 indexed tokenId,
        address indexed retiredBy,
        uint256 timestamp
    );
    
    constructor(string memory _uri) ERC1155(_uri) {
        // URI should be something like: "https://api.bluecarbon.com/metadata/{id}.json"
    }
    
    /**
     * @dev Mint a unique carbon credit NFT
     */
    function mintUniqueCredit(
        address _to,
        uint256 _tokenId,
        uint256 _creditAmount,
        string memory _ipfsMetadata,
        string memory _certificateName
    ) external onlyOwner {
        require(_to != address(0), "Invalid recipient address");
        require(_creditAmount > 0, "Credit amount must be greater than 0");
        require(bytes(_certificateName).length > 0, "Certificate name required");
        require(uniqueCredits[_tokenId].mintedAt == 0, "Token ID already exists");
        
        // Create unique credit record
        UniqueCredit storage newCredit = uniqueCredits[_tokenId];
        newCredit.projectId = 0; // Will be set by project owner
        newCredit.creditAmount = _creditAmount;
        newCredit.ipfsMetadata = _ipfsMetadata;
        newCredit.certificateName = _certificateName;
        newCredit.isRetired = false;
        newCredit.mintedAt = block.timestamp;
        newCredit.originalMinter = _to;
        
        // Update tracking mappings
        ownerTokens[_to].push(_tokenId);
        
        // Mint the NFT
        _mint(_to, _tokenId, 1, "");
        
        emit UniqueCreditMinted(_tokenId, 0, _creditAmount, _to, _certificateName);
    }
    
    /**
     * @dev Mint a project-specific unique carbon credit NFT
     */
    function mintProjectCredit(
        address _to,
        uint256 _projectId,
        uint256 _creditAmount,
        string memory _ipfsMetadata,
        string memory _certificateName
    ) external onlyOwner returns (uint256) {
        require(_to != address(0), "Invalid recipient address");
        require(_projectId > 0, "Invalid project ID");
        require(_creditAmount > 0, "Credit amount must be greater than 0");
        require(bytes(_certificateName).length > 0, "Certificate name required");
        
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        
        // Create unique credit record
        UniqueCredit storage newCredit = uniqueCredits[newTokenId];
        newCredit.projectId = _projectId;
        newCredit.creditAmount = _creditAmount;
        newCredit.ipfsMetadata = _ipfsMetadata;
        newCredit.certificateName = _certificateName;
        newCredit.isRetired = false;
        newCredit.mintedAt = block.timestamp;
        newCredit.originalMinter = _to;
        
        // Update tracking mappings
        projectTokens[_projectId].push(newTokenId);
        ownerTokens[_to].push(newTokenId);
        
        // Mint the NFT
        _mint(_to, newTokenId, 1, "");
        
        emit UniqueCreditMinted(newTokenId, _projectId, _creditAmount, _to, _certificateName);
        
        return newTokenId;
    }
    
    /**
     * @dev Retire a unique carbon credit NFT
     */
    function retireUniqueCredit(uint256 _tokenId) external nonReentrant {
        require(balanceOf(msg.sender, _tokenId) > 0, "Not the owner of this NFT");
        require(!uniqueCredits[_tokenId].isRetired, "Credit already retired");
        
        // Mark as retired
        uniqueCredits[_tokenId].isRetired = true;
        
        // Burn the NFT
        _burn(msg.sender, _tokenId, 1);
        
        emit UniqueCreditRetired(_tokenId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update NFT metadata
     */
    function updateTokenMetadata(
        uint256 _tokenId,
        string memory _newIpfsMetadata
    ) external onlyOwner {
        require(uniqueCredits[_tokenId].mintedAt > 0, "Token does not exist");
        require(bytes(_newIpfsMetadata).length > 0, "IPFS metadata cannot be empty");
        
        uniqueCredits[_tokenId].ipfsMetadata = _newIpfsMetadata;
    }
    
    /**
     * @dev Get unique credit details
     */
    function getUniqueCredit(uint256 _tokenId) external view returns (UniqueCredit memory) {
        require(uniqueCredits[_tokenId].mintedAt > 0, "Token does not exist");
        return uniqueCredits[_tokenId];
    }
    
    /**
     * @dev Get all token IDs for a project
     */
    function getProjectTokens(uint256 _projectId) external view returns (uint256[] memory) {
        return projectTokens[_projectId];
    }
    
    /**
     * @dev Get all token IDs owned by an address
     */
    function getOwnerTokens(address _owner) external view returns (uint256[] memory) {
        return ownerTokens[_owner];
    }
    
    /**
     * @dev Get total number of unique credits minted
     */
    function getTotalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Check if a token is retired
     */
    function isRetired(uint256 _tokenId) external view returns (bool) {
        return uniqueCredits[_tokenId].isRetired;
    }
    
    /**
     * @dev Set new URI for metadata
     */
    function setURI(string memory _newURI) external onlyOwner {
        _setURI(_newURI);
    }
    
    /**
     * @dev Override transfer functions to update owner tracking
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
        
        // Update owner tracking when transferring
        if (from != address(0) && to != address(0) && from != to) {
            for (uint256 i = 0; i < ids.length; i++) {
                uint256 tokenId = ids[i];
                
                // Remove from old owner's list
                _removeTokenFromOwner(from, tokenId);
                
                // Add to new owner's list
                ownerTokens[to].push(tokenId);
            }
        }
    }
    
    /**
     * @dev Remove token from owner's list
     */
    function _removeTokenFromOwner(address _owner, uint256 _tokenId) internal {
        uint256[] storage tokens = ownerTokens[_owner];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == _tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Support interface detection
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
