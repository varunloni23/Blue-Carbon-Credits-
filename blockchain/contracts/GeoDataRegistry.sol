// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title GeoDataRegistry
 * @dev Smart contract for storing GPS coordinates and image metadata on blockchain
 * @notice This contract handles all geographic data submissions from mobile users
 */
contract GeoDataRegistry is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;

    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant DATA_SUBMITTER_ROLE = keccak256("DATA_SUBMITTER_ROLE");

    Counters.Counter private _submissionIdCounter;

    struct GPSCoordinates {
        int256 latitude;      // Latitude * 1e6 for precision
        int256 longitude;     // Longitude * 1e6 for precision
        int256 altitude;      // Altitude in meters * 1e2 for precision
        uint256 accuracy;     // GPS accuracy in meters * 1e2
        uint256 timestamp;    // Unix timestamp when coordinates were recorded
    }

    struct ImageMetadata {
        string ipfsHash;      // IPFS hash of the image
        string filename;      // Original filename
        uint256 fileSize;     // File size in bytes
        uint256 captureTime; // When the image was captured
        string imageType;     // JPEG, PNG, etc.
        uint256 width;        // Image width in pixels
        uint256 height;       // Image height in pixels
    }

    struct DataSubmission {
        uint256 id;
        address submitter;
        string projectId;
        string projectType;   // mangrove, seagrass, saltmarsh, etc.
        GPSCoordinates location;
        ImageMetadata[] images;
        string description;
        uint256 submissionTime;
        bool isVerified;
        address verifiedBy;
        uint256 verificationTime;
        string verificationNotes;
        uint256 carbonCreditsAwarded;
    }

    // Storage
    mapping(uint256 => DataSubmission) public submissions;
    mapping(address => uint256[]) public submissionsByUser;
    mapping(string => uint256[]) public submissionsByProject;
    mapping(bytes32 => uint256) public submissionsByLocation; // Hash of lat/lng to submission ID

    // Events
    event DataSubmitted(
        uint256 indexed submissionId,
        address indexed submitter,
        string projectId,
        int256 latitude,
        int256 longitude,
        uint256 imageCount
    );

    event DataVerified(
        uint256 indexed submissionId,
        address indexed verifier,
        bool approved,
        uint256 carbonCreditsAwarded
    );

    event LocationDataUpdated(
        uint256 indexed submissionId,
        int256 newLatitude,
        int256 newLongitude
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(DATA_SUBMITTER_ROLE, msg.sender);
    }

    /**
     * @dev Submit geographic data with images
     * @param projectId The project this data belongs to
     * @param projectType Type of blue carbon project
     * @param latitude GPS latitude * 1e6
     * @param longitude GPS longitude * 1e6
     * @param altitude GPS altitude in meters * 1e2
     * @param accuracy GPS accuracy in meters * 1e2
     * @param description Text description of the submission
     * @param imageHashes Array of IPFS hashes for images
     * @param imageSizes Array of image file sizes
     * @param imageFilenames Array of image filenames
     */
    function submitGeoData(
        string memory projectId,
        string memory projectType,
        int256 latitude,
        int256 longitude,
        int256 altitude,
        uint256 accuracy,
        string memory description,
        string[] memory imageHashes,
        uint256[] memory imageSizes,
        string[] memory imageFilenames
    ) external onlyRole(DATA_SUBMITTER_ROLE) nonReentrant returns (uint256) {
        require(bytes(projectId).length > 0, "Project ID cannot be empty");
        require(imageHashes.length > 0, "At least one image required");
        require(imageHashes.length == imageSizes.length, "Image arrays length mismatch");
        require(imageHashes.length == imageFilenames.length, "Filename arrays length mismatch");
        require(latitude >= -90000000 && latitude <= 90000000, "Invalid latitude");
        require(longitude >= -180000000 && longitude <= 180000000, "Invalid longitude");

        _submissionIdCounter.increment();
        uint256 submissionId = _submissionIdCounter.current();

        // Create GPS coordinates
        GPSCoordinates memory location = GPSCoordinates({
            latitude: latitude,
            longitude: longitude,
            altitude: altitude,
            accuracy: accuracy,
            timestamp: block.timestamp
        });

        // Create submission
        DataSubmission storage submission = submissions[submissionId];
        submission.id = submissionId;
        submission.submitter = msg.sender;
        submission.projectId = projectId;
        submission.projectType = projectType;
        submission.location = location;
        submission.description = description;
        submission.submissionTime = block.timestamp;
        submission.isVerified = false;

        // Add images
        for (uint256 i = 0; i < imageHashes.length; i++) {
            submission.images.push(ImageMetadata({
                ipfsHash: imageHashes[i],
                filename: imageFilenames[i],
                fileSize: imageSizes[i],
                captureTime: block.timestamp,
                imageType: "JPEG", // Default, could be enhanced
                width: 0, // Could be added as parameter
                height: 0  // Could be added as parameter
            }));
        }

        // Update mappings
        submissionsByUser[msg.sender].push(submissionId);
        submissionsByProject[projectId].push(submissionId);
        
        // Create location hash for spatial queries
        bytes32 locationHash = keccak256(abi.encodePacked(latitude, longitude));
        submissionsByLocation[locationHash] = submissionId;

        emit DataSubmitted(
            submissionId,
            msg.sender,
            projectId,
            latitude,
            longitude,
            imageHashes.length
        );

        return submissionId;
    }

    /**
     * @dev Verify submitted data and award carbon credits
     * @param submissionId The submission to verify
     * @param approved Whether the submission is approved
     * @param carbonCredits Amount of carbon credits to award
     * @param verificationNotes Notes from the verifier
     */
    function verifySubmission(
        uint256 submissionId,
        bool approved,
        uint256 carbonCredits,
        string memory verificationNotes
    ) external onlyRole(VERIFIER_ROLE) {
        require(submissionId <= _submissionIdCounter.current(), "Invalid submission ID");
        require(!submissions[submissionId].isVerified, "Already verified");

        DataSubmission storage submission = submissions[submissionId];
        submission.isVerified = true;
        submission.verifiedBy = msg.sender;
        submission.verificationTime = block.timestamp;
        submission.verificationNotes = verificationNotes;

        if (approved) {
            submission.carbonCreditsAwarded = carbonCredits;
        }

        emit DataVerified(submissionId, msg.sender, approved, carbonCredits);
    }

    /**
     * @dev Get submission details
     * @param submissionId The submission ID to query
     */
    function getSubmission(uint256 submissionId) 
        external 
        view 
        returns (
            uint256 id,
            address submitter,
            string memory projectId,
            string memory projectType,
            GPSCoordinates memory location,
            string memory description,
            uint256 submissionTime,
            bool isVerified,
            uint256 carbonCreditsAwarded
        ) 
    {
        require(submissionId <= _submissionIdCounter.current(), "Invalid submission ID");
        
        DataSubmission storage submission = submissions[submissionId];
        return (
            submission.id,
            submission.submitter,
            submission.projectId,
            submission.projectType,
            submission.location,
            submission.description,
            submission.submissionTime,
            submission.isVerified,
            submission.carbonCreditsAwarded
        );
    }

    /**
     * @dev Get image metadata for a submission
     * @param submissionId The submission ID
     */
    function getSubmissionImages(uint256 submissionId) 
        external 
        view 
        returns (ImageMetadata[] memory) 
    {
        require(submissionId <= _submissionIdCounter.current(), "Invalid submission ID");
        return submissions[submissionId].images;
    }

    /**
     * @dev Get submissions by user
     * @param user The user address
     */
    function getSubmissionsByUser(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return submissionsByUser[user];
    }

    /**
     * @dev Get submissions by project
     * @param projectId The project ID
     */
    function getSubmissionsByProject(string memory projectId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return submissionsByProject[projectId];
    }

    /**
     * @dev Get submissions within a geographic area (simplified rectangular bounds)
     * @param minLatitude Minimum latitude * 1e6
     * @param maxLatitude Maximum latitude * 1e6
     * @param minLongitude Minimum longitude * 1e6
     * @param maxLongitude Maximum longitude * 1e6
     */
    function getSubmissionsInArea(
        int256 minLatitude,
        int256 maxLatitude,
        int256 minLongitude,
        int256 maxLongitude
    ) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](_submissionIdCounter.current());
        uint256 count = 0;

        for (uint256 i = 1; i <= _submissionIdCounter.current(); i++) {
            GPSCoordinates memory location = submissions[i].location;
            
            if (location.latitude >= minLatitude && 
                location.latitude <= maxLatitude &&
                location.longitude >= minLongitude && 
                location.longitude <= maxLongitude) {
                result[count] = i;
                count++;
            }
        }

        // Resize array to actual count
        uint256[] memory filteredResult = new uint256[](count);
        for (uint256 j = 0; j < count; j++) {
            filteredResult[j] = result[j];
        }

        return filteredResult;
    }

    /**
     * @dev Get total number of submissions
     */
    function getTotalSubmissions() external view returns (uint256) {
        return _submissionIdCounter.current();
    }

    /**
     * @dev Grant data submitter role to user
     * @param user The user to grant role to
     */
    function grantSubmitterRole(address user) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DATA_SUBMITTER_ROLE, user);
    }

    /**
     * @dev Grant verifier role to user
     * @param user The user to grant role to
     */
    function grantVerifierRole(address user) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(VERIFIER_ROLE, user);
    }

    /**
     * @dev Update location data (for corrections)
     * @param submissionId The submission to update
     * @param newLatitude New latitude * 1e6
     * @param newLongitude New longitude * 1e6
     */
    function updateLocation(
        uint256 submissionId,
        int256 newLatitude,
        int256 newLongitude
    ) external onlyRole(VERIFIER_ROLE) {
        require(submissionId <= _submissionIdCounter.current(), "Invalid submission ID");
        require(newLatitude >= -90000000 && newLatitude <= 90000000, "Invalid latitude");
        require(newLongitude >= -180000000 && newLongitude <= 180000000, "Invalid longitude");

        submissions[submissionId].location.latitude = newLatitude;
        submissions[submissionId].location.longitude = newLongitude;

        emit LocationDataUpdated(submissionId, newLatitude, newLongitude);
    }

    /**
     * @dev Get statistics about submissions
     */
    function getStatistics() 
        external 
        view 
        returns (
            uint256 totalSubmissions,
            uint256 verifiedSubmissions,
            uint256 totalCarbonCredits,
            uint256 uniqueSubmitters
        ) 
    {
        totalSubmissions = _submissionIdCounter.current();
        verifiedSubmissions = 0;
        totalCarbonCredits = 0;
        
        for (uint256 i = 1; i <= totalSubmissions; i++) {
            if (submissions[i].isVerified) {
                verifiedSubmissions++;
                totalCarbonCredits += submissions[i].carbonCreditsAwarded;
            }
        }

        // Note: uniqueSubmitters calculation would require additional storage
        // For now, returning 0 as placeholder
        uniqueSubmitters = 0;
    }
}
