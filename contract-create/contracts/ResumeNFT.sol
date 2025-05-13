// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./VerificationManager.sol";

contract ResumeNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    VerificationManager public verificationManager;
    mapping(uint256 => bool) private _transferable;

    event ResumeMinted(address indexed recipient, uint256 tokenId);
    event ResumeUpdated(uint256 indexed tokenId, string newTokenURI);
    event TransferabilityChanged(uint256 indexed tokenId, bool isTransferable);
    event ResumeBurned(uint256 indexed tokenId);

    error NotOwner();
    error TransferDisabled();
    error InvalidTokenId();
    error NotAuthorized();
    error OrganizationNotVerified();
    error InvalidEntryId();

    constructor(
        address _verificationManager,
        address initialOwner
    )
        ERC721("ResumeNFT", "RNFT")
        Ownable(initialOwner)
    {
        verificationManager = VerificationManager(_verificationManager);
    }

    // Request verification from an organization
    function requestVerification(
        address user,
        uint256 tokenId,
        string memory entryId,
        address organization,
        string memory details
    ) external returns (uint256) {
        if (ownerOf(tokenId) != msg.sender) revert NotOwner();
        if (!verificationManager.isVerifiedOrganization(organization)) revert OrganizationNotVerified();
        if (bytes(entryId).length == 0) revert InvalidEntryId();
        if (bytes(details).length == 0) revert InvalidEntryId();
        
        return verificationManager.createVerificationRequest(
            user,
            tokenId,
            entryId,
            organization,
            details
        );
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
        if (ownerOf(tokenId) != msg.sender) revert NotOwner();
        _setTokenURI(tokenId, newTokenURI);
        emit ResumeUpdated(tokenId, newTokenURI);
    }

    function setTransferable(uint256 tokenId, bool transferable_) public onlyOwner {
        _transferable[tokenId] = transferable_;
        emit TransferabilityChanged(tokenId, transferable_);
    }

    function burnResume(uint256 tokenId) public {
        if (!_isAuthorized(_ownerOf(tokenId), msg.sender, tokenId)) revert NotAuthorized();
        _burn(tokenId);
        delete _transferable[tokenId];
        emit ResumeBurned(tokenId);
    }

    function isTransferable(uint256 tokenId) public view returns (bool) {
        return _transferable[tokenId];
    }

    function updateVerificationManager(address newManager) public onlyOwner {
        verificationManager = VerificationManager(newManager);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        // If this is a transfer (not a mint or burn) and token is not transferable, revert
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0) && !_transferable[tokenId]) {
            revert TransferDisabled();
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
