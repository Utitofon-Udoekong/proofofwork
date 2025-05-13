// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VerificationManager is Ownable, ReentrancyGuard {
    enum RequestStatus { Pending, Approved, Rejected }

    struct Organization {
        string name;
        string email;
        string website;
        bool isVerified;
        uint256 verificationTimestamp;
        uint256 lastUpdateTimestamp;
        bool exists;
    }

    struct VerificationRequest {
        uint256 id;
        address user;
        uint256 resumeId;
        string entryId;
        address organization;
        string details;
        RequestStatus status;
        uint256 timestamp;
        string verificationDetails;
    }

    // Organization management
    mapping(address => Organization) private organizations;
    address[] private organizationList;

    // Request management
    uint256 public requestCount;
    mapping(uint256 => VerificationRequest) public requests;
    mapping(address => uint256[]) private userRequests;
    mapping(address => uint256[]) private orgRequests;
    mapping(uint256 => mapping(string => uint256)) public resumeEntryRequests;
    
    // Track request counts for pagination
    mapping(address => uint256) public userRequestCount;
    mapping(address => uint256) public orgRequestCount;

    // Events
    event OrganizationAdded(address indexed organization, string name, string email, string website);
    event OrganizationVerified(address indexed organization);
    event OrganizationRevoked(address indexed organization);
    event OrganizationRemoved(address indexed organization);
    event RequestCreated(
        uint256 indexed id,
        address indexed user,
        address indexed organization,
        uint256 resumeId,
        string entryId,
        string details
    );
    event RequestApproved(
        uint256 indexed id,
        address indexed organization,
        string verificationDetails
    );
    event RequestRejected(
        uint256 indexed id,
        address indexed organization,
        string reason
    );

    uint256 public constant MIN_VERIFICATION_DURATION = 1 days;

    error OrganizationNotFound();
    error OrganizationAlreadyExists();
    error OrganizationNotVerified();
    error OrganizationAlreadyVerified();
    error InvalidAddress();
    error InsufficientTimeElapsed();
    error DuplicateRequest();
    error InvalidEntryId();

    constructor() Ownable(msg.sender) {}

    // Organization Management
    function addOrganization(
        address _organization,
        string memory _name,
        string memory _email,
        string memory _website
    ) external nonReentrant {
        if (_organization == address(0)) revert InvalidAddress();
        if (organizations[_organization].exists) revert OrganizationAlreadyExists();

        organizations[_organization] = Organization({
            name: _name,
            email: _email,
            website: _website,
            isVerified: false,
            verificationTimestamp: 0,
            lastUpdateTimestamp: block.timestamp,
            exists: true
        });
        organizationList.push(_organization);
        emit OrganizationAdded(_organization, _name, _email, _website);
    }

    function verifyOrganization(address _organization) external onlyOwner nonReentrant {
        if (!organizations[_organization].exists) revert OrganizationNotFound();
        if (organizations[_organization].isVerified) revert OrganizationAlreadyVerified();
        
        Organization storage org = organizations[_organization];
        if (org.verificationTimestamp != 0 && 
            block.timestamp < org.lastUpdateTimestamp + MIN_VERIFICATION_DURATION) {
            revert InsufficientTimeElapsed();
        }

        org.isVerified = true;
        org.verificationTimestamp = block.timestamp;
        org.lastUpdateTimestamp = block.timestamp;
        emit OrganizationVerified(_organization);
    }

    function revokeOrganization(address _organization) external onlyOwner nonReentrant {
        if (!organizations[_organization].exists) revert OrganizationNotFound();
        if (!organizations[_organization].isVerified) revert OrganizationNotVerified();
        
        Organization storage org = organizations[_organization];
        if (block.timestamp < org.lastUpdateTimestamp + MIN_VERIFICATION_DURATION) {
            revert InsufficientTimeElapsed();
        }

        org.isVerified = false;
        org.lastUpdateTimestamp = block.timestamp;
        emit OrganizationRevoked(_organization);
    }

    function removeOrganization(address _organization) external onlyOwner nonReentrant {
        if (!organizations[_organization].exists) revert OrganizationNotFound();
        
        delete organizations[_organization];
        for (uint256 i = 0; i < organizationList.length; i++) {
            if (organizationList[i] == _organization) {
                organizationList[i] = organizationList[organizationList.length - 1];
                organizationList.pop();
                break;
            }
        }
        emit OrganizationRemoved(_organization);
    }

    // Request Management
    function createVerificationRequest(
        address user,
        uint256 resumeId,
        string memory entryId,
        address organization,
        string memory details
    ) external returns (uint256) {
        if (!organizations[organization].exists) revert OrganizationNotFound();
        if (!organizations[organization].isVerified) revert OrganizationNotVerified();
        if (bytes(entryId).length == 0) revert InvalidEntryId();
        if (bytes(details).length == 0) revert InvalidEntryId();

        // Check for duplicate pending request
        uint256 existingRequestId = resumeEntryRequests[resumeId][entryId];
        if (existingRequestId != 0) {
            VerificationRequest storage existingRequest = requests[existingRequestId];
            if (existingRequest.status == RequestStatus.Pending) revert DuplicateRequest();
        }

        requestCount++;
        uint256 newRequestId = requestCount;
        
        requests[newRequestId] = VerificationRequest({
            id: newRequestId,
            user: user,
            resumeId: resumeId,
            entryId: entryId,
            organization: organization,
            details: details,
            status: RequestStatus.Pending,
            timestamp: block.timestamp,
            verificationDetails: ""
        });

        userRequestCount[user]++;
        orgRequestCount[organization]++;
        userRequests[user].push(newRequestId);
        orgRequests[organization].push(newRequestId);
        resumeEntryRequests[resumeId][entryId] = newRequestId;

        emit RequestCreated(newRequestId, user, organization, resumeId, entryId, details);
        return newRequestId;
    }

    function approveRequest(uint256 requestId, string memory verificationDetails) external {
        VerificationRequest storage req = requests[requestId];
        if (!organizations[msg.sender].isVerified) revert OrganizationNotVerified();
        if (req.organization != msg.sender) revert OrganizationNotFound();
        if (req.status != RequestStatus.Pending) revert DuplicateRequest();
        
        req.status = RequestStatus.Approved;
        req.verificationDetails = verificationDetails;
        
        emit RequestApproved(requestId, msg.sender, verificationDetails);
    }

    function rejectRequest(uint256 requestId, string memory reason) external {
        VerificationRequest storage req = requests[requestId];
        if (!organizations[msg.sender].isVerified) revert OrganizationNotVerified();
        if (req.organization != msg.sender) revert OrganizationNotFound();
        if (req.status != RequestStatus.Pending) revert DuplicateRequest();
        
        req.status = RequestStatus.Rejected;
        
        emit RequestRejected(requestId, msg.sender, reason);
    }

    // View functions
    function isVerifiedOrganization(address _organization) public view returns (bool) {
        return organizations[_organization].exists && organizations[_organization].isVerified;
    }

    function getOrganizationDetails(address _organization) 
        external 
        view 
        returns (
            string memory name,
            string memory email,
            string memory website,
            bool verifiedStatus,
            uint256 verificationTimestamp,
            uint256 lastUpdateTimestamp,
            bool exists
        ) 
    {
        Organization storage org = organizations[_organization];
        return (
            org.name,
            org.email,
            org.website,
            org.isVerified,
            org.verificationTimestamp,
            org.lastUpdateTimestamp,
            org.exists
        );
    }

    function getRequest(uint256 requestId) external view returns (VerificationRequest memory) {
        return requests[requestId];
    }

    function getUserRequests(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory) {
        uint256 totalRequests = userRequestCount[user];
        if (offset >= totalRequests) return new uint256[](0);
        
        uint256 end = offset + limit;
        if (end > totalRequests) end = totalRequests;
        
        uint256[] memory result = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = userRequests[user][i];
        }
        return result;
    }

    function getOrgRequests(
        address org,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory) {
        uint256 totalRequests = orgRequestCount[org];
        if (offset >= totalRequests) return new uint256[](0);
        
        uint256 end = offset + limit;
        if (end > totalRequests) end = totalRequests;
        
        uint256[] memory result = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = orgRequests[org][i];
        }
        return result;
    }

    function getPendingRequestsForOrg(
        address org,
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory) {
        uint256[] memory orgReqIds = orgRequests[org];
        uint256 pendingCount = 0;
        
        for (uint256 i = 0; i < orgReqIds.length; i++) {
            if (requests[orgReqIds[i]].status == RequestStatus.Pending) {
                pendingCount++;
            }
        }
        
        if (offset >= pendingCount) return new uint256[](0);
        
        uint256 end = offset + limit;
        if (end > pendingCount) end = pendingCount;
        
        uint256[] memory pendingRequests = new uint256[](end - offset);
        uint256 currentIndex = 0;
        uint256 resultIndex = 0;
        
        for (uint256 i = 0; i < orgReqIds.length && resultIndex < pendingRequests.length; i++) {
            if (requests[orgReqIds[i]].status == RequestStatus.Pending) {
                if (currentIndex >= offset) {
                    pendingRequests[resultIndex] = orgReqIds[i];
                    resultIndex++;
                }
                currentIndex++;
            }
        }
        
        return pendingRequests;
    }

    function getOrganizationCount() external view returns (uint256) {
        return organizationList.length;
    }

    function getOrganizationAtIndex(uint256 index) external view returns (address) {
        require(index < organizationList.length, "Index out of bounds");
        return organizationList[index];
    }
} 