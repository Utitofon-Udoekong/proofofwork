import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { VerificationManager } from "../typechain-types";

describe("VerificationManager Contract", function () {
  let verificationManager: VerificationManager;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const VerificationManager = await ethers.getContractFactory("VerificationManager");
    verificationManager = await VerificationManager.deploy();
  });

  describe("Organization Management", function () {
    it("should add a new organization", async function () {
      const tx = await verificationManager.addOrganization(
        addr1.address,
        "Org1",
        "org1@email.com",
        "https://org1.com"
      );
      await expect(tx).to.emit(verificationManager, "OrganizationAdded");
      
      const org = await verificationManager.getOrganizationDetails(addr1.address);
      expect(org.name).to.equal("Org1");
      expect(org.email).to.equal("org1@email.com");
      expect(org.website).to.equal("https://org1.com");
      expect(org.verifiedStatus).to.be.false;
    });

    it("should not allow adding an organization twice", async function () {
      await verificationManager.addOrganization(
        addr1.address,
        "Org1",
        "org1@email.com",
        "https://org1.com"
      );
      await expect(
        verificationManager.addOrganization(
          addr1.address,
          "Org1",
          "org1@email.com",
          "https://org1.com"
        )
      ).to.be.revertedWithCustomError(verificationManager, "OrganizationAlreadyExists");
    });

    it("should verify an organization", async function () {
      await verificationManager.addOrganization(
        addr1.address,
        "Org1",
        "org1@email.com",
        "https://org1.com"
      );
      const tx = await verificationManager.verifyOrganization(addr1.address);
      await expect(tx).to.emit(verificationManager, "OrganizationVerified");

      const org = await verificationManager.getOrganizationDetails(addr1.address);
      expect(org.verifiedStatus).to.be.true;
    });

    it("should revoke organization verification", async function () {
      await verificationManager.addOrganization(
        addr1.address,
        "Org1",
        "org1@email.com",
        "https://org1.com"
      );
      await verificationManager.verifyOrganization(addr1.address);
      
      // Increase time to pass MIN_VERIFICATION_DURATION
      await ethers.provider.send("evm_increaseTime", [86401]); // 1 day + 1 second
      await ethers.provider.send("evm_mine");
      
      const tx = await verificationManager.revokeOrganization(addr1.address);
      await expect(tx).to.emit(verificationManager, "OrganizationRevoked");

      const org = await verificationManager.getOrganizationDetails(addr1.address);
      expect(org.verifiedStatus).to.be.false;
    });

    it("should remove an organization", async function () {
      await verificationManager.addOrganization(
        addr1.address,
        "Org1",
        "org1@email.com",
        "https://org1.com"
      );
      const tx = await verificationManager.removeOrganization(addr1.address);
      await expect(tx).to.emit(verificationManager, "OrganizationRemoved");

      const org = await verificationManager.getOrganizationDetails(addr1.address);
      expect(org.exists).to.be.false;
    });
  });

  describe("Verification Requests", function () {
    beforeEach(async function () {
      await verificationManager.addOrganization(
        addr1.address,
        "Org1",
        "org1@email.com",
        "https://org1.com"
      );
      await verificationManager.verifyOrganization(addr1.address);
    });

    it("should create a verification request", async function () {
      const tx = await verificationManager.createVerificationRequest(
        addr2.address,
        1, // resumeId
        "entry1",
        addr1.address,
        "Please verify my work experience"
      );
      await expect(tx).to.emit(verificationManager, "RequestCreated");

      const request = await verificationManager.getRequest(1);
      expect(request.resumeId).to.equal(1);
      expect(request.entryId).to.equal("entry1");
      expect(request.organization).to.equal(addr1.address);
      expect(request.details).to.equal("Please verify my work experience");
      expect(request.status).to.equal(0); // Pending
    });

    it("should not allow duplicate requests", async function () {
      await verificationManager.createVerificationRequest(
        addr2.address,
        1,
        "entry1",
        addr1.address,
        "Please verify my work experience"
      );
      await expect(
        verificationManager.createVerificationRequest(
          addr2.address,
          1,
          "entry1",
          addr1.address,
          "Please verify my work experience"
        )
      ).to.be.revertedWithCustomError(verificationManager, "DuplicateRequest");
    });

    it("should not allow requests to unverified organizations", async function () {
      await verificationManager.addOrganization(
        addr2.address,
        "Org2",
        "org2@email.com",
        "https://org2.com"
      );
      await expect(
        verificationManager.createVerificationRequest(
          addr2.address,
          1,
          "entry1",
          addr2.address,
          "Please verify my work experience"
        )
      ).to.be.revertedWithCustomError(verificationManager, "OrganizationNotVerified");
    });

    it("should allow organization to approve request", async function () {
      await verificationManager.createVerificationRequest(
        addr2.address,
        1,
        "entry1",
        addr1.address,
        "Please verify my work experience"
      );
      const tx = await verificationManager.connect(addr1).approveRequest(
        1,
        "Verified work experience"
      );
      await expect(tx).to.emit(verificationManager, "RequestApproved");

      const request = await verificationManager.getRequest(1);
      expect(request.status).to.equal(1); // Approved
      expect(request.verificationDetails).to.equal("Verified work experience");
    });

    it("should not allow non-requested organization to approve request", async function () {
      await verificationManager.createVerificationRequest(
        addr2.address,
        1,
        "entry1",
        addr1.address,
        "Please verify my work experience"
      );
      await expect(
        verificationManager.connect(addr2).approveRequest(
          1,
          "Verified work experience"
        )
      ).to.be.revertedWithCustomError(verificationManager, "OrganizationNotVerified");
    });

    it("should allow organization to reject request", async function () {
      await verificationManager.createVerificationRequest(
        addr2.address,
        1,
        "entry1",
        addr1.address,
        "Please verify my work experience"
      );
      const tx = await verificationManager.connect(addr1).rejectRequest(
        1,
        "Invalid experience"
      );
      await expect(tx).to.emit(verificationManager, "RequestRejected");

      const request = await verificationManager.getRequest(1);
      expect(request.status).to.equal(2); // Rejected
    });

    it("should not allow non-requested organization to reject request", async function () {
      await verificationManager.createVerificationRequest(
        addr2.address,
        1,
        "entry1",
        addr1.address,
        "Please verify my work experience"
      );
      await expect(
        verificationManager.connect(addr2).rejectRequest(
          1,
          "Invalid experience"
        )
      ).to.be.revertedWithCustomError(verificationManager, "OrganizationNotVerified");
    });

    it("should not allow empty entry ID in verification request", async function () {
      await expect(
        verificationManager.createVerificationRequest(
          addr2.address,
          1,
          "", // empty entry ID
          addr1.address,
          "Please verify my work experience"
        )
      ).to.be.revertedWithCustomError(verificationManager, "InvalidEntryId");
    });

    it("should not allow empty details in verification request", async function () {
      await expect(
        verificationManager.createVerificationRequest(
          addr2.address,
          1,
          "entry1",
          addr1.address,
          "" // empty details
        )
      ).to.be.revertedWithCustomError(verificationManager, "InvalidEntryId");
    });

  });

  describe("Request Retrieval", function () {
    beforeEach(async function () {
      await verificationManager.addOrganization(
        addr1.address,
        "Org1",
        "org1@email.com",
        "https://org1.com"
      );
      await verificationManager.verifyOrganization(addr1.address);

      // Create multiple requests
      for (let i = 0; i < 5; i++) {
        await verificationManager.createVerificationRequest(
          addr2.address,
          i + 1,
          `entry${i + 1}`,
          addr1.address,
          `Request ${i + 1}`
        );
      }
    });

    it("should retrieve user requests with pagination", async function () {
      // Initial requests should be retrievable
      const initialRequests = await verificationManager.getUserRequests(addr2.address, 0, 2);
      expect(initialRequests.length).to.equal(2);
      
      // Get the actual request details
      const request1 = await verificationManager.getRequest(initialRequests[0]);
      const request2 = await verificationManager.getRequest(initialRequests[1]);
      expect(request1.resumeId).to.equal(1);
      expect(request2.resumeId).to.equal(2);

      // Create additional requests for addr2
      for (let i = 0; i < 3; i++) {
        await verificationManager.connect(addr2).createVerificationRequest(
          addr2.address,
          i + 6,
          `entry${i + 6}`,
          addr1.address,
          `Request ${i + 6}`
        );
      }

      // Get next page of requests
      const nextRequests = await verificationManager.getUserRequests(addr2.address, 2, 2);
      expect(nextRequests.length).to.equal(2);
      
      // Get the actual request details
      const request3 = await verificationManager.getRequest(nextRequests[0]);
      const request4 = await verificationManager.getRequest(nextRequests[1]);
      expect(request3.resumeId).to.equal(3);
      expect(request4.resumeId).to.equal(4);
    });

    it("should retrieve organization requests with pagination", async function () {
      const requests = await verificationManager.getOrgRequests(addr1.address, 0, 2);
      expect(requests.length).to.equal(2);
      
      // Get the actual request details
      const request1 = await verificationManager.getRequest(requests[0]);
      const request2 = await verificationManager.getRequest(requests[1]);
      expect(request1.resumeId).to.equal(1);
      expect(request2.resumeId).to.equal(2);

      const nextRequests = await verificationManager.getOrgRequests(addr1.address, 2, 2);
      expect(nextRequests.length).to.equal(2);
      
      // Get the actual request details
      const request3 = await verificationManager.getRequest(nextRequests[0]);
      const request4 = await verificationManager.getRequest(nextRequests[1]);
      expect(request3.resumeId).to.equal(3);
      expect(request4.resumeId).to.equal(4);
    });
  });
}); 