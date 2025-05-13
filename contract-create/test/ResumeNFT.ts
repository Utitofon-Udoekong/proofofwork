import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ResumeNFT, VerificationManager } from "../typechain-types";

describe("ResumeNFT Contract", function () {
  let resumeNFT: ResumeNFT;
  let verificationManager: VerificationManager;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let tokenId: bigint;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy VerificationManager contract
    const VerificationManager = await ethers.getContractFactory("VerificationManager");
    verificationManager = await VerificationManager.deploy();

    // Deploy ResumeNFT contract
    const ResumeNFT = await ethers.getContractFactory("ResumeNFT");
    resumeNFT = await ResumeNFT.deploy(
      await verificationManager.getAddress(),
      owner.address
    );

    // Add and verify organizations
    await verificationManager.addOrganization(addr1.address, "Org1", "org1@email.com", "https://org1.com");
    await verificationManager.verifyOrganization(addr1.address);
  });

  describe("Minting", function () {
    it("should mint a new resume NFT", async function () {
      const tx = await resumeNFT.mintResume(addr2.address, "ipfs://metadata");
      const receipt = await tx.wait();
      const event = receipt?.logs[0];
      tokenId = BigInt(1);
      expect(await resumeNFT.ownerOf(tokenId)).to.equal(addr2.address);
    });
  });

  describe("Resume URI", function () {
    beforeEach(async function () {
      await resumeNFT.mintResume(addr2.address, "ipfs://metadata");
      tokenId = BigInt(1);
    });

    it("should allow owner to update resume URI", async function () {
      await resumeNFT.connect(addr2).updateResumeURI(tokenId, "ipfs://new-metadata");
      expect(await resumeNFT.tokenURI(tokenId)).to.equal("ipfs://new-metadata");
    });

    it("should not allow non-owner to update resume URI", async function () {
      await expect(
        resumeNFT.connect(addr1).updateResumeURI(tokenId, "ipfs://new-metadata")
      ).to.be.revertedWithCustomError(resumeNFT, "NotOwner");
    });
  });

  describe("Verification Requests", function () {
    beforeEach(async function () {
      await resumeNFT.mintResume(addr2.address, "ipfs://metadata");
      tokenId = BigInt(1);
    });

    it("should allow owner to request verification from verified organization", async function () {
      const tx = await resumeNFT.connect(addr2).requestVerification(
        addr2.address,
        tokenId,
        "entry1",
        addr1.address,
        "Please verify my work experience"
      );
      await expect(tx).to.emit(verificationManager, "RequestCreated");
    });

    it("should not allow non-owner to request verification", async function () {
      await expect(
        resumeNFT.connect(addr1).requestVerification(
          addr2.address,
          tokenId,
          "entry1",
          addr1.address,
          "Please verify my work experience"
        )
      ).to.be.revertedWithCustomError(resumeNFT, "NotOwner");
    });

    it("should not allow verification request to unverified organization", async function () {
      await expect(
        resumeNFT.connect(addr2).requestVerification(
          addr2.address,
          tokenId,
          "entry1",
          addr2.address,
          "Please verify my work experience"
        )
      ).to.be.revertedWithCustomError(verificationManager, "OrganizationNotVerified");
    });

    it("should not allow empty entry ID in verification request", async function () {
      await expect(
        resumeNFT.connect(addr2).requestVerification(
          addr2.address,
          tokenId,
          "", // empty entry ID
          addr1.address,
          "Please verify my work experience"
        )
      ).to.be.revertedWithCustomError(resumeNFT, "InvalidEntryId");
    });

  });

  describe("Transferability", function () {
    beforeEach(async function () {
      await resumeNFT.mintResume(addr2.address, "ipfs://metadata");
      tokenId = BigInt(1);
    });

    it("should not allow transfer by default", async function () {
      await expect(
        resumeNFT.connect(addr2).transferFrom(addr2.address, addr1.address, tokenId)
      ).to.be.revertedWithCustomError(resumeNFT, "TransferDisabled");
    });

    it("should allow transfer when enabled by owner", async function () {
      await resumeNFT.setTransferable(tokenId, true);
      await resumeNFT.connect(addr2).transferFrom(addr2.address, addr1.address, tokenId);
      expect(await resumeNFT.ownerOf(tokenId)).to.equal(addr1.address);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await resumeNFT.mintResume(addr2.address, "ipfs://metadata");
      tokenId = BigInt(1);
    });

    it("should allow owner to burn their resume", async function () {
      await resumeNFT.connect(addr2).burnResume(tokenId);
      await expect(resumeNFT.ownerOf(tokenId)).to.be.revertedWithCustomError(resumeNFT, "ERC721NonexistentToken");
    });

    it("should not allow non-owner to burn resume", async function () {
      await expect(
        resumeNFT.connect(addr1).burnResume(tokenId)
      ).to.be.revertedWithCustomError(resumeNFT, "NotAuthorized");
    });
  });
});
