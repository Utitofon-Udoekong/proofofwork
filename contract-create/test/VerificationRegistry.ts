import { expect } from "chai";
import hre from "hardhat";

describe("VerificationRegistry", function () {
  async function deployRegistryFixture() {
    const [owner, org1, org2] = await hre.viem.getWalletClients();
    const verificationRegistry = await hre.viem.deployContract("VerificationRegistry");
    return { verificationRegistry, owner, org1, org2 };
  }

  it("should verify and revoke an organization", async () => {
    const { verificationRegistry, org1 } = await deployRegistryFixture();
    const org1Address = org1.account.address;
    await verificationRegistry.write.verifyOrganization([org1Address]);
    expect(await verificationRegistry.read.isVerifiedOrganization([org1Address])).to.be.true;

    await verificationRegistry.write.revokeOrganization([org1Address]);
    expect(await verificationRegistry.read.isVerifiedOrganization([org1Address])).to.be.false;
  });

  it("should not verify an already verified organization", async () => {
    const { verificationRegistry, org1 } = await deployRegistryFixture();
    const org1Address = org1.account.address;
    await verificationRegistry.write.verifyOrganization([org1Address]);
    
    // With viem, we need to check for reverts differently
    try {
      await verificationRegistry.write.verifyOrganization([org1Address]);
      // If we get here, the transaction didn't revert
      expect.fail("Expected transaction to revert with 'Already verified'");
    } catch (error) {
      expect((error as Error).message).to.include("Already verified");
    }
  });

  it("should not revoke a non-verified organization", async () => {
    const { verificationRegistry, org2 } = await deployRegistryFixture();
    const org2Address = org2.account.address;
    
    // With viem, we need to check for reverts differently
    try {
      await verificationRegistry.write.revokeOrganization([org2Address]);
      // If we get here, the transaction didn't revert
      expect.fail("Expected transaction to revert with 'Not verified'");
    } catch (error) {
      expect((error as Error).message).to.include("Not verified");
    }
  });
});