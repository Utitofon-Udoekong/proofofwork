import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { type ResumeNFT } from "../typechain-types";
import { type VerificationRegistry } from "../typechain-types";

describe("ResumeNFT Contract", function () {
  let resumeNFT: ResumeNFT;
  let verificationRegistry: VerificationRegistry;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let tokenId: bigint;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy VerificationRegistry contract
    const VerificationRegistry = await ethers.getContractFactory("VerificationRegistry");
    verificationRegistry = await VerificationRegistry.deploy();

    // Deploy ResumeNFT contract with owner address as initialOwner parameter
    const ResumeNFT = await ethers.getContractFactory("ResumeNFT");
    resumeNFT = await ResumeNFT.deploy(await verificationRegistry.getAddress(), await owner.getAddress());

    // Add a verified organization to the VerificationRegistry
    await verificationRegistry.verifyOrganization(await owner.getAddress());
  });

  describe("Minting", function () {
    it("should mint a new ResumeNFT to the owner and set tokenURI", async function () {
      const metadataURI = "ipfs://resume1";
      const tx = await resumeNFT.mintResume(await owner.getAddress(), metadataURI);
      await tx.wait();
      tokenId = BigInt(1);
      expect(await resumeNFT.ownerOf(tokenId)).to.equal(await owner.getAddress());
      expect(await resumeNFT.tokenURI(tokenId)).to.equal(metadataURI);
    });
  });

  describe("Updating Resume URI", function () {
    beforeEach(async function () {
      const metadataURI = "ipfs://resume1";
      const tx = await resumeNFT.mintResume(await owner.getAddress(), metadataURI);
      await tx.wait();
      tokenId = BigInt(1);
    });

    it("should allow the owner to update the tokenURI", async function () {
      const newURI = "ipfs://resume2";
      await resumeNFT.connect(owner).updateResumeURI(tokenId, newURI);
      expect(await resumeNFT.tokenURI(tokenId)).to.equal(newURI);
    });

    it("should not allow a non-owner to update the tokenURI", async function () {
      const newURI = "ipfs://resume2";
      await expect(resumeNFT.connect(addr1).updateResumeURI(tokenId, newURI)).to.be.revertedWith("Not the owner");
    });
  });

  describe("Verification", function () {
    beforeEach(async function () {
      const metadataURI = "ipfs://resume1";
      const tx = await resumeNFT.mintResume(await owner.getAddress(), metadataURI);
      await tx.wait();
      tokenId = BigInt(1);
    });

    it("should allow a verified organization to verify an entry", async function () {
      // owner is a verified org
      await resumeNFT.connect(owner).verifyEntry(tokenId, 0, "Verified by Org");
      const verification = await resumeNFT.entryVerifications(tokenId, 0);
      expect(verification.verifier).to.equal(await owner.getAddress());
      expect(verification.details).to.equal("Verified by Org");
      expect(verification.timestamp).to.be.gt(0);
    });

    it("should not allow a non-verified org to verify an entry", async function () {
      await expect(
        resumeNFT.connect(addr1).verifyEntry(tokenId, 0, "Fake Org")
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Transferability (Soulbound)", function () {
    beforeEach(async function () {
      const metadataURI = "ipfs://resume1";
      const tx = await resumeNFT.mintResume(await owner.getAddress(), metadataURI);
      await tx.wait();
      tokenId = BigInt(1);
    });

    it("should not allow transferring if transferable is false", async function () {
      await expect(
        resumeNFT.transferFrom(await owner.getAddress(), await addr1.getAddress(), tokenId)
      ).to.be.reverted; // Soulbound logic
    });

    it("should allow owner to change transferability", async function () {
      await resumeNFT.setTransferable(tokenId, true);
      expect(await resumeNFT.isTransferable(tokenId)).to.equal(true);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      const metadataURI = "ipfs://resume1";
      const tx = await resumeNFT.mintResume(await owner.getAddress(), metadataURI);
      await tx.wait();
      tokenId = BigInt(1);
    });

    it("should allow the owner to burn a resume", async function () {
      await resumeNFT.burnResume(tokenId);
      await expect(resumeNFT.ownerOf(tokenId)).to.be.reverted;
    });
  });
});
