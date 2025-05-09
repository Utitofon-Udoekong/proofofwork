// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./VerificationRegistry.sol";

contract ResumeNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    VerificationRegistry public verificationRegistry;
    mapping(uint256 => bool) private _transferable;

    // Optional: Verification struct for entry verification
    struct Verification {
        address verifier;
        uint256 timestamp;
        string details; // e.g., organization name or notes
    }
    // tokenId => entryId => Verification
    mapping(uint256 => mapping(string => Verification)) public entryVerifications;

    event ResumeMinted(address indexed recipient, uint256 tokenId);
    event ResumeUpdated(uint256 indexed tokenId, string newTokenURI);
    event EntryVerified(uint256 indexed tokenId, string entryId, address verifier, string details);
    event TransferabilityChanged(uint256 indexed tokenId, bool isTransferable);
    event ResumeBurned(uint256 indexed tokenId);

    constructor(address _verificationRegistry, address initialOwner)
        ERC721("ResumeNFT", "RNFT")
        Ownable(initialOwner)
    {
        verificationRegistry = VerificationRegistry(_verificationRegistry);
    }

    modifier onlyVerifiedOrg() {
        require(verificationRegistry.isVerifiedOrganization(msg.sender), "Not authorized");
        _;
    }

    function mintResume(address recipient, string memory metadataURI) public returns (uint256) {
        _tokenIds += 1;
        uint256 newResumeId = _tokenIds;
        _mint(recipient, newResumeId);
        _setTokenURI(newResumeId, metadataURI);
        _transferable[newResumeId] = false;
        emit ResumeMinted(recipient, newResumeId);
        return newResumeId;
    }

    // Allow the owner to update the tokenURI (IPFS hash) for their resume
    function updateResumeURI(uint256 tokenId, string memory newTokenURI) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        _setTokenURI(tokenId, newTokenURI);
        emit ResumeUpdated(tokenId, newTokenURI);
    }

    // Allow a verified organization to verify a specific entry in the resume using entryId
    function verifyEntry(uint256 tokenId, string memory entryId, string memory details) public onlyVerifiedOrg {
        entryVerifications[tokenId][entryId] = Verification({
            verifier: msg.sender,
            timestamp: block.timestamp,
            details: details
        });
        emit EntryVerified(tokenId, entryId, msg.sender, details);
    }

    // Get verification details for a specific entry
    function getEntryVerification(uint256 tokenId, string memory entryId) 
        public 
        view 
        returns (Verification memory) 
    {
        return entryVerifications[tokenId][entryId];
    }

    function setTransferable(uint256 tokenId, bool transferable_) public onlyOwner {
        _transferable[tokenId] = transferable_;
        emit TransferabilityChanged(tokenId, transferable_);
    }

    function burnResume(uint256 tokenId) public {
        require(_isAuthorized(_ownerOf(tokenId), msg.sender, tokenId), "Not owner or approved");
        _burn(tokenId);
        delete _transferable[tokenId];
        emit ResumeBurned(tokenId);
    }

    function isTransferable(uint256 tokenId) public view returns (bool) {
        return _transferable[tokenId];
    }

    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        return tokenURI(tokenId);
    }

    function updateVerificationRegistry(address newRegistry) public onlyOwner {
        verificationRegistry = VerificationRegistry(newRegistry);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        // If this is a transfer (not a mint or burn) and token is not transferable, revert
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0) && !_transferable[tokenId]) {
            revert("Soulbound: transfer disabled");
        }
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
