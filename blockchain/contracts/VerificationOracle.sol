// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ProjectRegistry.sol";
import "./CarbonCreditToken.sol";

/**
 * @title VerificationOracle
 * @dev Handles multi-source verification of restoration projects
 */
contract VerificationOracle is Ownable, ReentrancyGuard {
    
    enum DataSource {
        Community,
        Satellite,
        Drone,
        ThirdParty
    }
    
    enum VerificationStatus {
        Pending,
        Verified,
        Rejected,
        RequiresReview
    }
    
    struct VerificationData {
        uint256 projectId;
        DataSource source;
        string ipfsHash;
        string description;
        address submitter;
        uint256 timestamp;
        VerificationStatus status;
        string notes;
        uint256 carbonCreditsEstimate;
    }
    
    struct ProjectVerification {
        uint256 projectId;
        uint256[] verificationIds;
        uint256 communityDataCount;
        uint256 satelliteDataCount;
        uint256 droneDataCount;
        uint256 thirdPartyDataCount;
        uint256 verifiedDataCount;
        bool isCompletelyVerified;
        uint256 finalCarbonCredits;
        uint256 lastUpdateTimestamp;
    }
    
    ProjectRegistry public projectRegistry;
    CarbonCreditToken public carbonCreditToken;
    
    mapping(uint256 => VerificationData) public verificationData; // verificationId => VerificationData
    mapping(uint256 => ProjectVerification) public projectVerifications; // projectId => ProjectVerification
    mapping(address => bool) public authorizedVerifiers;
    mapping(DataSource => uint256) public minimumDataRequirements; // Minimum data points needed per source
    mapping(DataSource => uint256) public verificationWeights; // Weight of each data source in final verification
    
    uint256 private _verificationIdCounter;
    uint256 public constant VERIFICATION_THRESHOLD = 7000; // 70% agreement needed (in basis points)
    
    event VerificationDataSubmitted(
        uint256 indexed verificationId,
        uint256 indexed projectId,
        DataSource source,
        address submitter,
        string ipfsHash
    );
    
    event VerificationStatusUpdated(
        uint256 indexed verificationId,
        VerificationStatus oldStatus,
        VerificationStatus newStatus,
        address updatedBy
    );
    
    event ProjectVerificationCompleted(
        uint256 indexed projectId,
        uint256 finalCarbonCredits,
        uint256 timestamp
    );
    
    event CarbonCreditsIssued(
        uint256 indexed projectId,
        uint256 amount,
        address recipient
    );
    
    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner(), "Not authorized verifier");
        _;
    }
    
    modifier validProjectId(uint256 _projectId) {
        require(_projectId > 0, "Invalid project ID");
        _;
    }
    
    constructor(
        address _projectRegistry,
        address _carbonCreditToken
    ) {
        require(_projectRegistry != address(0), "Invalid project registry address");
        require(_carbonCreditToken != address(0), "Invalid carbon credit token address");
        
        projectRegistry = ProjectRegistry(_projectRegistry);
        carbonCreditToken = CarbonCreditToken(_carbonCreditToken);
        
        // Set default minimum data requirements
        minimumDataRequirements[DataSource.Community] = 3;
        minimumDataRequirements[DataSource.Satellite] = 2;
        minimumDataRequirements[DataSource.Drone] = 1;
        minimumDataRequirements[DataSource.ThirdParty] = 1;
        
        // Set default verification weights (basis points)
        verificationWeights[DataSource.Community] = 3000; // 30%
        verificationWeights[DataSource.Satellite] = 3500; // 35%
        verificationWeights[DataSource.Drone] = 2500; // 25%
        verificationWeights[DataSource.ThirdParty] = 1000; // 10%
    }
    
    /**
     * @dev Submit verification data for a project
     */
    function submitVerificationData(
        uint256 _projectId,
        DataSource _source,
        string memory _ipfsHash,
        string memory _description,
        uint256 _carbonCreditsEstimate
    ) external validProjectId(_projectId) returns (uint256) {
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(_carbonCreditsEstimate > 0, "Carbon credits estimate must be greater than 0");
        
        _verificationIdCounter++;
        uint256 verificationId = _verificationIdCounter;
        
        VerificationData storage newData = verificationData[verificationId];
        newData.projectId = _projectId;
        newData.source = _source;
        newData.ipfsHash = _ipfsHash;
        newData.description = _description;
        newData.submitter = msg.sender;
        newData.timestamp = block.timestamp;
        newData.status = VerificationStatus.Pending;
        newData.carbonCreditsEstimate = _carbonCreditsEstimate;
        
        // Update project verification tracking
        ProjectVerification storage projectVerif = projectVerifications[_projectId];
        if (projectVerif.projectId == 0) {
            projectVerif.projectId = _projectId;
        }
        
        projectVerif.verificationIds.push(verificationId);
        
        // Update data source counts
        if (_source == DataSource.Community) {
            projectVerif.communityDataCount++;
        } else if (_source == DataSource.Satellite) {
            projectVerif.satelliteDataCount++;
        } else if (_source == DataSource.Drone) {
            projectVerif.droneDataCount++;
        } else if (_source == DataSource.ThirdParty) {
            projectVerif.thirdPartyDataCount++;
        }
        
        projectVerif.lastUpdateTimestamp = block.timestamp;
        
        emit VerificationDataSubmitted(verificationId, _projectId, _source, msg.sender, _ipfsHash);
        
        return verificationId;
    }
    
    /**
     * @dev Update verification status (only authorized verifiers)
     */
    function updateVerificationStatus(
        uint256 _verificationId,
        VerificationStatus _newStatus,
        string memory _notes
    ) external onlyAuthorizedVerifier {
        require(_verificationId > 0 && _verificationId <= _verificationIdCounter, "Invalid verification ID");
        
        VerificationData storage data = verificationData[_verificationId];
        VerificationStatus oldStatus = data.status;
        data.status = _newStatus;
        data.notes = _notes;
        
        // Update verified data count
        ProjectVerification storage projectVerif = projectVerifications[data.projectId];
        
        if (oldStatus != VerificationStatus.Verified && _newStatus == VerificationStatus.Verified) {
            projectVerif.verifiedDataCount++;
        } else if (oldStatus == VerificationStatus.Verified && _newStatus != VerificationStatus.Verified) {
            projectVerif.verifiedDataCount--;
        }
        
        projectVerif.lastUpdateTimestamp = block.timestamp;
        
        emit VerificationStatusUpdated(_verificationId, oldStatus, _newStatus, msg.sender);
        
        // Check if project verification is complete
        _checkProjectVerificationCompletion(data.projectId);
    }
    
    /**
     * @dev Check if project verification is complete and issue credits if so
     */
    function _checkProjectVerificationCompletion(uint256 _projectId) internal {
        ProjectVerification storage projectVerif = projectVerifications[_projectId];
        
        // Check if minimum data requirements are met
        bool hasMinimumData = 
            projectVerif.communityDataCount >= minimumDataRequirements[DataSource.Community] &&
            projectVerif.satelliteDataCount >= minimumDataRequirements[DataSource.Satellite] &&
            projectVerif.droneDataCount >= minimumDataRequirements[DataSource.Drone] &&
            projectVerif.thirdPartyDataCount >= minimumDataRequirements[DataSource.ThirdParty];
        
        if (!hasMinimumData) {
            return;
        }
        
        // Calculate weighted verification score
        uint256 totalWeight = 0;
        uint256 verifiedWeight = 0;
        
        for (uint256 i = 0; i < projectVerif.verificationIds.length; i++) {
            uint256 verificationId = projectVerif.verificationIds[i];
            VerificationData storage data = verificationData[verificationId];
            
            uint256 weight = verificationWeights[data.source];
            totalWeight += weight;
            
            if (data.status == VerificationStatus.Verified) {
                verifiedWeight += weight;
            }
        }
        
        // Check if verification threshold is met
        uint256 verificationScore = (verifiedWeight * 10000) / totalWeight;
        
        if (verificationScore >= VERIFICATION_THRESHOLD && !projectVerif.isCompletelyVerified) {
            projectVerif.isCompletelyVerified = true;
            
            // Calculate final carbon credits based on verified data
            uint256 finalCredits = _calculateFinalCarbonCredits(_projectId);
            projectVerif.finalCarbonCredits = finalCredits;
            
            emit ProjectVerificationCompleted(_projectId, finalCredits, block.timestamp);
            
            // Update project registry
            projectRegistry.updateTotalCarbonCredits(_projectId, finalCredits);
            
            // Issue carbon credits
            _issueCarbonCredits(_projectId, finalCredits);
        }
    }
    
    /**
     * @dev Calculate final carbon credits based on verified data
     */
    function _calculateFinalCarbonCredits(uint256 _projectId) internal view returns (uint256) {
        ProjectVerification storage projectVerif = projectVerifications[_projectId];
        
        uint256 totalEstimate = 0;
        uint256 totalWeight = 0;
        
        for (uint256 i = 0; i < projectVerif.verificationIds.length; i++) {
            uint256 verificationId = projectVerif.verificationIds[i];
            VerificationData storage data = verificationData[verificationId];
            
            if (data.status == VerificationStatus.Verified) {
                uint256 weight = verificationWeights[data.source];
                totalEstimate += data.carbonCreditsEstimate * weight;
                totalWeight += weight;
            }
        }
        
        return totalWeight > 0 ? totalEstimate / totalWeight : 0;
    }
    
    /**
     * @dev Issue carbon credits to project owner
     */
    function _issueCarbonCredits(uint256 _projectId, uint256 _amount) internal {
        ProjectRegistry.Project memory project = projectRegistry.getProject(_projectId);
        
        // Mint carbon credits to project owner
        uint256 batchId = carbonCreditToken.mintCreditBatch(
            _projectId,
            _amount,
            block.timestamp, // vintage year
            "Blue Carbon MRV Standard",
            "", // IPFS metadata will be added separately
            project.projectOwner
        );
        
        emit CarbonCreditsIssued(_projectId, _amount, project.projectOwner);
    }
    
    /**
     * @dev Add authorized verifier
     */
    function addVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid verifier address");
        authorizedVerifiers[_verifier] = true;
    }
    
    /**
     * @dev Remove authorized verifier
     */
    function removeVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = false;
    }
    
    /**
     * @dev Update minimum data requirements
     */
    function updateMinimumDataRequirements(
        DataSource _source,
        uint256 _minimum
    ) external onlyOwner {
        minimumDataRequirements[_source] = _minimum;
    }
    
    /**
     * @dev Update verification weights
     */
    function updateVerificationWeights(
        DataSource _source,
        uint256 _weight
    ) external onlyOwner {
        require(_weight <= 10000, "Weight cannot exceed 100%");
        verificationWeights[_source] = _weight;
    }
    
    /**
     * @dev Get verification data
     */
    function getVerificationData(uint256 _verificationId) external view returns (VerificationData memory) {
        return verificationData[_verificationId];
    }
    
    /**
     * @dev Get project verification details
     */
    function getProjectVerification(uint256 _projectId) external view returns (ProjectVerification memory) {
        return projectVerifications[_projectId];
    }
    
    /**
     * @dev Get all verification IDs for a project
     */
    function getProjectVerificationIds(uint256 _projectId) external view returns (uint256[] memory) {
        return projectVerifications[_projectId].verificationIds;
    }
    
    /**
     * @dev Check if address is authorized verifier
     */
    function isAuthorizedVerifier(address _verifier) external view returns (bool) {
        return authorizedVerifiers[_verifier];
    }
    
    /**
     * @dev Get total verification count
     */
    function getTotalVerifications() external view returns (uint256) {
        return _verificationIdCounter;
    }
    
    /**
     * @dev Check if project meets verification requirements
     */
    function checkVerificationRequirements(uint256 _projectId) external view returns (bool) {
        ProjectVerification storage projectVerif = projectVerifications[_projectId];
        
        return projectVerif.communityDataCount >= minimumDataRequirements[DataSource.Community] &&
               projectVerif.satelliteDataCount >= minimumDataRequirements[DataSource.Satellite] &&
               projectVerif.droneDataCount >= minimumDataRequirements[DataSource.Drone] &&
               projectVerif.thirdPartyDataCount >= minimumDataRequirements[DataSource.ThirdParty];
    }
}
