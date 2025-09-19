// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ProjectRegistry
 * @dev Registry contract for blue carbon restoration projects
 */
contract ProjectRegistry is Ownable, ReentrancyGuard {
    
    uint256 private _projectIdCounter;
    
    enum ProjectStatus {
        Pending,
        Approved,
        Active,
        Completed,
        Suspended
    }
    
    enum EcosystemType {
        Mangrove,
        Seagrass,
        SaltMarsh
    }
    
    struct Project {
        uint256 id;
        string name;
        string description;
        EcosystemType ecosystemType;
        string location; // GPS coordinates and address
        uint256 areaInHectares;
        address projectOwner;
        address[] communityWallets;
        address[] verifiers;
        ProjectStatus status;
        uint256 createdAt;
        uint256 approvedAt;
        string ipfsHashMetadata; // IPFS hash for detailed project data
        uint256 estimatedCarbonCredits;
        uint256 totalCarbonCredits;
        bool isActive;
    }
    
    struct ProjectMetadata {
        string[] ipfsPhotos; // IPFS hashes of project photos
        string[] ipfsDroneData; // IPFS hashes of drone imagery
        string[] ipfsSatelliteData; // IPFS hashes of satellite data
        uint256 lastUpdated;
        string additionalNotes;
    }
    
    mapping(uint256 => Project) public projects;
    mapping(uint256 => ProjectMetadata) public projectMetadata;
    mapping(address => uint256[]) public ownerProjects;
    mapping(address => bool) public authorizedVerifiers;
    
    event ProjectRegistered(
        uint256 indexed projectId,
        address indexed owner,
        string name,
        EcosystemType ecosystemType,
        string location
    );
    
    event ProjectApproved(
        uint256 indexed projectId,
        address indexed approver,
        uint256 approvedAt
    );
    
    event ProjectStatusUpdated(
        uint256 indexed projectId,
        ProjectStatus oldStatus,
        ProjectStatus newStatus
    );
    
    event MetadataUpdated(
        uint256 indexed projectId,
        string ipfsHash,
        uint256 timestamp
    );
    
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    
    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner(), "Not authorized verifier");
        _;
    }
    
    modifier projectExists(uint256 _projectId) {
        require(_projectId > 0 && _projectId <= _projectIdCounter, "Project does not exist");
        _;
    }
    
    constructor() {}
    
    /**
     * @dev Register a new blue carbon restoration project
     */
    function registerProject(
        string memory _name,
        string memory _description,
        EcosystemType _ecosystemType,
        string memory _location,
        uint256 _areaInHectares,
        address[] memory _communityWallets,
        string memory _ipfsHashMetadata,
        uint256 _estimatedCarbonCredits
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "Project name cannot be empty");
        require(bytes(_location).length > 0, "Location cannot be empty");
        require(_areaInHectares > 0, "Area must be greater than 0");
        require(_estimatedCarbonCredits > 0, "Estimated credits must be greater than 0");
        
        _projectIdCounter++;
        uint256 newProjectId = _projectIdCounter;
        
        Project storage newProject = projects[newProjectId];
        newProject.id = newProjectId;
        newProject.name = _name;
        newProject.description = _description;
        newProject.ecosystemType = _ecosystemType;
        newProject.location = _location;
        newProject.areaInHectares = _areaInHectares;
        newProject.projectOwner = msg.sender;
        newProject.communityWallets = _communityWallets;
        newProject.status = ProjectStatus.Pending;
        newProject.createdAt = block.timestamp;
        newProject.ipfsHashMetadata = _ipfsHashMetadata;
        newProject.estimatedCarbonCredits = _estimatedCarbonCredits;
        newProject.isActive = true;
        
        ownerProjects[msg.sender].push(newProjectId);
        
        emit ProjectRegistered(
            newProjectId,
            msg.sender,
            _name,
            _ecosystemType,
            _location
        );
        
        return newProjectId;
    }
    
    /**
     * @dev Approve a project (only authorized verifiers)
     */
    function approveProject(uint256 _projectId) 
        external 
        onlyAuthorizedVerifier 
        projectExists(_projectId) 
    {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.Pending, "Project not in pending status");
        
        ProjectStatus oldStatus = project.status;
        project.status = ProjectStatus.Approved;
        project.approvedAt = block.timestamp;
        
        emit ProjectApproved(_projectId, msg.sender, block.timestamp);
        emit ProjectStatusUpdated(_projectId, oldStatus, ProjectStatus.Approved);
    }
    
    /**
     * @dev Update project status
     */
    function updateProjectStatus(uint256 _projectId, ProjectStatus _newStatus)
        external
        onlyAuthorizedVerifier
        projectExists(_projectId)
    {
        Project storage project = projects[_projectId];
        ProjectStatus oldStatus = project.status;
        project.status = _newStatus;
        
        emit ProjectStatusUpdated(_projectId, oldStatus, _newStatus);
    }
    
    /**
     * @dev Update project metadata with new IPFS data
     */
    function updateProjectMetadata(
        uint256 _projectId,
        string[] memory _ipfsPhotos,
        string[] memory _ipfsDroneData,
        string[] memory _ipfsSatelliteData,
        string memory _additionalNotes
    ) external projectExists(_projectId) {
        Project storage project = projects[_projectId];
        require(
            msg.sender == project.projectOwner || 
            authorizedVerifiers[msg.sender] || 
            msg.sender == owner(),
            "Not authorized to update metadata"
        );
        
        ProjectMetadata storage metadata = projectMetadata[_projectId];
        metadata.ipfsPhotos = _ipfsPhotos;
        metadata.ipfsDroneData = _ipfsDroneData;
        metadata.ipfsSatelliteData = _ipfsSatelliteData;
        metadata.lastUpdated = block.timestamp;
        metadata.additionalNotes = _additionalNotes;
        
        emit MetadataUpdated(_projectId, project.ipfsHashMetadata, block.timestamp);
    }
    
    /**
     * @dev Add authorized verifier
     */
    function addVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid verifier address");
        authorizedVerifiers[_verifier] = true;
        
        emit VerifierAdded(_verifier);
    }
    
    /**
     * @dev Remove authorized verifier
     */
    function removeVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = false;
        
        emit VerifierRemoved(_verifier);
    }
    
    /**
     * @dev Update total carbon credits for a project
     */
    function updateTotalCarbonCredits(uint256 _projectId, uint256 _credits)
        external
        onlyAuthorizedVerifier
        projectExists(_projectId)
    {
        projects[_projectId].totalCarbonCredits = _credits;
    }
    
    /**
     * @dev Get project details
     */
    function getProject(uint256 _projectId) 
        external 
        view 
        projectExists(_projectId) 
        returns (Project memory) 
    {
        return projects[_projectId];
    }
    
    /**
     * @dev Get project metadata
     */
    function getProjectMetadata(uint256 _projectId)
        external
        view
        projectExists(_projectId)
        returns (ProjectMetadata memory)
    {
        return projectMetadata[_projectId];
    }
    
    /**
     * @dev Get projects by owner
     */
    function getProjectsByOwner(address _owner) external view returns (uint256[] memory) {
        return ownerProjects[_owner];
    }
    
    /**
     * @dev Get total number of projects
     */
    function getTotalProjects() external view returns (uint256) {
        return _projectIdCounter;
    }
    
    /**
     * @dev Check if address is authorized verifier
     */
    function isAuthorizedVerifier(address _verifier) external view returns (bool) {
        return authorizedVerifiers[_verifier];
    }
}
