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

    uint256 public constant MAX_ENTRIES_PER_RESUME = 100;

    // EntryType enum to match TypeScript interface
    enum EntryType { WORK, EDUCATION, CERTIFICATION, PROJECT, SKILL, AWARD }

    struct ResumeEntry {
        EntryType entryType;
        string title;
        string description;
        uint256 startDate;
        uint256 endDate;
        string organization;
        bool verified;
        // Metadata field for additional type-specific data (stored as JSON)
        string metadata;
    }

    mapping(uint256 => ResumeEntry[]) private _resumeEntries;
    mapping(uint256 => bool) private _transferable;
    mapping(bytes32 => address) public verificationRequests;

    event ResumeMinted(address indexed recipient, uint256 tokenId);
    event ResumeEntryAdded(uint256 indexed tokenId, uint256 entryIndex, EntryType entryType);
    event VerificationRequested(uint256 indexed tokenId, uint256 indexed entryIndex, string organization);
    event EntryVerified(uint256 indexed tokenId, uint256 entryIndex);
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

    function addResumeEntry(
        uint256 tokenId,
        uint8 entryTypeValue,
        string memory title,
        string memory description,
        uint256 startDate,
        uint256 endDate,
        string memory organization,
        string memory metadata
    ) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(_resumeEntries[tokenId].length < MAX_ENTRIES_PER_RESUME, "Max entries reached");
        require(entryTypeValue <= uint8(EntryType.AWARD), "Invalid entry type");

        EntryType entryType = EntryType(entryTypeValue);

        ResumeEntry memory newEntry = ResumeEntry({
            entryType: entryType,
            title: title,
            description: description,
            startDate: startDate,
            endDate: endDate,
            organization: organization,
            verified: false,
            metadata: metadata
        });

        _resumeEntries[tokenId].push(newEntry);
        emit ResumeEntryAdded(tokenId, _resumeEntries[tokenId].length - 1, entryType);
    }

    function requestVerification(uint256 tokenId, uint256 entryIndex) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(entryIndex < _resumeEntries[tokenId].length, "Invalid entry");

        ResumeEntry memory entry = _resumeEntries[tokenId][entryIndex];
        bytes32 requestId = keccak256(abi.encodePacked(tokenId, entryIndex, entry.organization));
        verificationRequests[requestId] = msg.sender;

        emit VerificationRequested(tokenId, entryIndex, entry.organization);
    }

    function verifyEntry(uint256 tokenId, uint256 entryIndex) public onlyVerifiedOrg {
        require(entryIndex < _resumeEntries[tokenId].length, "Invalid entry");
        _resumeEntries[tokenId][entryIndex].verified = true;
        emit EntryVerified(tokenId, entryIndex);
    }

    function setTransferable(uint256 tokenId, bool transferable_) public onlyOwner {
        _transferable[tokenId] = transferable_;
        emit TransferabilityChanged(tokenId, transferable_);
    }

    function burnResume(uint256 tokenId) public {
        require(_isAuthorized(_ownerOf(tokenId), msg.sender, tokenId), "Not owner or approved");
        _burn(tokenId);
        delete _resumeEntries[tokenId];
        delete _transferable[tokenId];
        emit ResumeBurned(tokenId);
    }

    function updateEntry(
        uint256 tokenId,
        uint256 entryIndex,
        uint8 entryTypeValue,
        string memory title,
        string memory description,
        uint256 startDate,
        uint256 endDate,
        string memory organization,
        string memory metadata,
        string memory tokenURI_
    ) public {
        require(_isAuthorized(_ownerOf(tokenId), msg.sender, tokenId), "Not owner or approved");
        require(entryIndex < _resumeEntries[tokenId].length, "Invalid index");
        require(!_resumeEntries[tokenId][entryIndex].verified, "Cannot update verified entry");
        require(entryTypeValue <= uint8(EntryType.AWARD), "Invalid entry type");

        EntryType entryType = EntryType(entryTypeValue);

        ResumeEntry memory updatedEntry = ResumeEntry({
            entryType: entryType,
            title: title,
            description: description,
            startDate: startDate,
            endDate: endDate,
            organization: organization,
            verified: false,
            metadata: metadata
        });

        _resumeEntries[tokenId][entryIndex] = updatedEntry;
        _setTokenURI(tokenId, tokenURI_);
    }

    function getResumeEntries(uint256 tokenId) public view returns (ResumeEntry[] memory) {
        return _resumeEntries[tokenId];
    }

    function isTransferable(uint256 tokenId) public view returns (bool) {
        return _transferable[tokenId];
    }

    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        return tokenURI(tokenId);
    }

    function getEntryDetails(uint256 tokenId, uint256 entryIndex)
        public
        view
        returns (ResumeEntry memory, address requestor)
    {
        ResumeEntry memory entry = _resumeEntries[tokenId][entryIndex];
        bytes32 requestId = keccak256(abi.encodePacked(tokenId, entryIndex, entry.organization));
        return (entry, verificationRequests[requestId]);
    }

    // For frontend indexing
    function getEntriesByOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokens = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            tokens[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokens;
    }

    function getTotalEntries() public view returns (uint256) {
        return _tokenIds;
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
