// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VerificationRegistry is Ownable, ReentrancyGuard {
    struct Organization {
        address addr;
        bool isVerified;
        uint256 verificationTimestamp;
        uint256 lastUpdateTimestamp;
        bool exists;
    }

    // Array to store organizations for better front-running protection
    Organization[] private organizations;
    
    // Mapping for quick lookup (address => index in organizations array + 1)
    mapping(address => uint256) private organizationIndices;

    // Events
    event OrganizationVerified(address indexed organization, uint256 timestamp);
    event OrganizationRevoked(address indexed organization, uint256 timestamp);
    event OrganizationAdded(address indexed organization, uint256 timestamp);
    event OrganizationRemoved(address indexed organization, uint256 timestamp);

    // Constants
    uint256 public constant MIN_VERIFICATION_DURATION = 1 days;

    // Custom errors
    error OrganizationNotFound();
    error OrganizationAlreadyExists();
    error OrganizationNotVerified();
    error OrganizationAlreadyVerified();
    error InvalidAddress();
    error InsufficientTimeElapsed();

    constructor() Ownable(msg.sender) {}

    // Modifiers
    modifier validAddress(address _address) {
        if (_address == address(0)) revert InvalidAddress();
        _;
    }

    modifier organizationExists(address _organization) {
        if (!_organizationExists(_organization)) revert OrganizationNotFound();
        _;
    }

    modifier organizationNotExists(address _organization) {
        if (_organizationExists(_organization)) revert OrganizationAlreadyExists();
        _;
    }

    modifier isVerified(address _organization) {
        if (!isVerifiedOrganization(_organization)) revert OrganizationNotVerified();
        _;
    }

    modifier notVerified(address _organization) {
        if (isVerifiedOrganization(_organization)) revert OrganizationAlreadyVerified();
        _;
    }

    modifier sufficientTimeElapsed(address _organization) {
        uint256 index = organizationIndices[_organization] - 1;
        // Allow immediate verification for new organizations (verificationTimestamp == 0)
        if (organizations[index].verificationTimestamp == 0) {
            _;
            return;
        }
        if (block.timestamp < organizations[index].lastUpdateTimestamp + MIN_VERIFICATION_DURATION) {
            revert InsufficientTimeElapsed();
        }
        _;
    }

    // Internal functions
    function _organizationExists(address _organization) internal view returns (bool) {
        uint256 index = organizationIndices[_organization];
        if (index == 0) return false;
        return index - 1 < organizations.length && organizations[index - 1].exists;
    }

    function _validateOrganizationIndex(uint256 index) internal view {
        if (index >= organizations.length) revert OrganizationNotFound();
    }

    // External functions
    function addOrganization(address _organization) 
        external 
        onlyOwner 
        nonReentrant 
        validAddress(_organization)
        organizationNotExists(_organization)
    {
        organizations.push(Organization({
            addr: _organization,
            isVerified: false,
            verificationTimestamp: 0,
            lastUpdateTimestamp: block.timestamp,
            exists: true
        }));

        organizationIndices[_organization] = organizations.length;
        emit OrganizationAdded(_organization, block.timestamp);
    }

    function verifyOrganization(address _organization) 
        external 
        onlyOwner 
        nonReentrant 
        validAddress(_organization)
        organizationExists(_organization)
        notVerified(_organization)
        sufficientTimeElapsed(_organization)
    {
        uint256 index = organizationIndices[_organization] - 1;
        Organization storage org = organizations[index];
        
        org.isVerified = true;
        org.verificationTimestamp = block.timestamp;
        org.lastUpdateTimestamp = block.timestamp;

        emit OrganizationVerified(_organization, block.timestamp);
    }

    function revokeOrganization(address _organization) 
        external 
        onlyOwner 
        nonReentrant 
        validAddress(_organization)
        organizationExists(_organization)
        isVerified(_organization)
        sufficientTimeElapsed(_organization)
    {
        uint256 index = organizationIndices[_organization] - 1;
        Organization storage org = organizations[index];
        
        org.isVerified = false;
        org.lastUpdateTimestamp = block.timestamp;

        emit OrganizationRevoked(_organization, block.timestamp);
    }

    function removeOrganization(address _organization) 
        external 
        onlyOwner 
        nonReentrant 
        validAddress(_organization)
        organizationExists(_organization)
    {
        uint256 index = organizationIndices[_organization] - 1;
        _validateOrganizationIndex(index);

        organizations[index].exists = false;

        if (index != organizations.length - 1) {
            organizations[index] = organizations[organizations.length - 1];
            organizationIndices[organizations[index].addr] = index + 1;
        }

        organizations.pop();
        delete organizationIndices[_organization];

        emit OrganizationRemoved(_organization, block.timestamp);
    }

    // View functions
    function isVerifiedOrganization(address _organization) public view returns (bool) {
        if (!_organizationExists(_organization)) return false;
        uint256 index = organizationIndices[_organization] - 1;
        return organizations[index].isVerified;
    }

    function getOrganizationDetails(address _organization) 
        external 
        view 
        returns (
            bool verifiedStatus,
            uint256 verificationTimestamp,
            uint256 lastUpdateTimestamp,
            bool exists
        ) 
    {
        if (!_organizationExists(_organization)) {
            return (false, 0, 0, false);
        }
        uint256 index = organizationIndices[_organization] - 1;
        Organization storage org = organizations[index];
        return (
            org.isVerified,
            org.verificationTimestamp,
            org.lastUpdateTimestamp,
            org.exists
        );
    }

    function getOrganizationCount() external view returns (uint256) {
        return organizations.length;
    }

    function getOrganizationAtIndex(uint256 _index) 
        external 
        view 
        returns (
            address organization,
            bool verifiedStatus,
            uint256 verificationTimestamp,
            uint256 lastUpdateTimestamp,
            bool exists
        ) 
    {
        _validateOrganizationIndex(_index);
        Organization storage org = organizations[_index];
        return (
            org.addr,
            org.isVerified,
            org.verificationTimestamp,
            org.lastUpdateTimestamp,
            org.exists
        );
    }
}
