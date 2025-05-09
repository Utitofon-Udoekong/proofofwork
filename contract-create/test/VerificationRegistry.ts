import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { VerificationRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("VerificationRegistry", function () {
  let verificationRegistry: VerificationRegistry;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const VerificationRegistry = await ethers.getContractFactory("VerificationRegistry");
    verificationRegistry = await VerificationRegistry.deploy();
  });

  describe("Organization Management", function () {
    it("should add an organization", async function () {
      await verificationRegistry.addOrganization(addr1.address);
      const [org, verifiedStatus] = await verificationRegistry.getOrganizationAtIndex(0);
      expect(org.toLowerCase()).to.equal(addr1.address.toLowerCase());
    });

    it("should not add a zero address", async function () {
      await expect(verificationRegistry.addOrganization(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(verificationRegistry, "InvalidAddress");
    });

    it("should not add an organization twice", async function () {
      await verificationRegistry.addOrganization(addr1.address);
      await expect(verificationRegistry.addOrganization(addr1.address))
        .to.be.revertedWithCustomError(verificationRegistry, "OrganizationAlreadyExists");
    });
  });

  describe("Verification Process", function () {
    it("should verify and revoke an organization with proper timing", async function () {
      await verificationRegistry.addOrganization(addr1.address);
      
      // New organizations can be verified immediately
      await verificationRegistry.verifyOrganization(addr1.address);
      
      // Try to revoke too soon
      await expect(verificationRegistry.revokeOrganization(addr1.address))
        .to.be.revertedWithCustomError(verificationRegistry, "InsufficientTimeElapsed");
      
      // Advance time by 1 day
      await time.increase(24 * 60 * 60);
      
      // Now revoke should work
      await verificationRegistry.revokeOrganization(addr1.address);
      const [org, verifiedStatus] = await verificationRegistry.getOrganizationAtIndex(0);
      expect(verifiedStatus).to.be.false;
    });

    it("should not verify an organization before adding it", async function () {
      await expect(verificationRegistry.verifyOrganization(addr1.address))
        .to.be.revertedWithCustomError(verificationRegistry, "OrganizationNotFound");
    });

    it("should not verify an already verified organization", async function () {
      await verificationRegistry.addOrganization(addr1.address);
      
      // First verification (immediate)
      await verificationRegistry.verifyOrganization(addr1.address);
      
      // Try to verify again immediately
      await expect(verificationRegistry.verifyOrganization(addr1.address))
        .to.be.revertedWithCustomError(verificationRegistry, "OrganizationAlreadyVerified");
    });

    it("should not revoke a non-verified organization", async function () {
      await verificationRegistry.addOrganization(addr1.address);
      await expect(verificationRegistry.revokeOrganization(addr1.address))
        .to.be.revertedWithCustomError(verificationRegistry, "OrganizationNotVerified");
    });
  });

  describe("Organization Removal", function () {
    it("should remove an organization", async function () {
      await verificationRegistry.addOrganization(addr1.address);
      await verificationRegistry.removeOrganization(addr1.address);
      await expect(verificationRegistry.getOrganizationAtIndex(0))
        .to.be.revertedWithCustomError(verificationRegistry, "OrganizationNotFound");
    });

    it("should maintain correct indices after removal", async function () {
      await verificationRegistry.addOrganization(addr1.address);
      await verificationRegistry.addOrganization(addr2.address);
      await verificationRegistry.removeOrganization(addr1.address);
      const [org, verifiedStatus] = await verificationRegistry.getOrganizationAtIndex(0);
      expect(org.toLowerCase()).to.equal(addr2.address.toLowerCase());
    });

    it("should not remove a non-existent organization", async function () {
      await expect(verificationRegistry.removeOrganization(addr1.address))
        .to.be.revertedWithCustomError(verificationRegistry, "OrganizationNotFound");
    });
  });

  describe("Organization Enumeration", function () {
    it("should return correct organization count", async function () {
      expect(await verificationRegistry.getOrganizationCount()).to.equal(0);
      await verificationRegistry.addOrganization(addr1.address);
      expect(await verificationRegistry.getOrganizationCount()).to.equal(1);
    });

    it("should return correct organization details by index", async function () {
      await verificationRegistry.addOrganization(addr1.address);
      const [org, verifiedStatus] = await verificationRegistry.getOrganizationAtIndex(0);
      expect(org.toLowerCase()).to.equal(addr1.address.toLowerCase());
      expect(verifiedStatus).to.be.false;
    });

    it("should revert when accessing invalid index", async function () {
      await expect(verificationRegistry.getOrganizationAtIndex(0))
        .to.be.revertedWithCustomError(verificationRegistry, "OrganizationNotFound");
    });
  });
});