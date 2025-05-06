// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract VerificationRegistry is Ownable {
    constructor() Ownable(msg.sender) {}

    mapping(address => bool) private verifiedOrganizations;

    event OrganizationVerified(address indexed organization);
    event OrganizationRevoked(address indexed organization);

    function verifyOrganization(address _organization) public onlyOwner {
        require(!verifiedOrganizations[_organization], "Already verified");
        verifiedOrganizations[_organization] = true;
        emit OrganizationVerified(_organization);
    }

    function revokeOrganization(address _organization) public onlyOwner {
        require(verifiedOrganizations[_organization], "Not verified");
        verifiedOrganizations[_organization] = false;
        emit OrganizationRevoked(_organization);
    }

    function isVerifiedOrganization(address _organization) public view returns (bool) {
        return verifiedOrganizations[_organization];
    }
}
