// Utility to parse errors from contract calls and other sources
export function parseError(error: any): string {
  if (!error) return "Unknown error occurred.";

  // Wagmi/viem/ethers contract revert with custom error
  if (typeof error.message === "string") {
    // Custom contract error
    const match = error.message.match(/Error: ([A-Za-z0-9_]+)\(\)/);
    if (match) {
      // Map known contract errors to friendly messages
      const errorMap: Record<string, string> = {
        InvalidEntryId: "The entry ID or details are missing or invalid.",
        OrganizationNotVerified: "The selected organization is not verified.",
        InsufficientTimeElapsed: "You must wait before revoking this organization.",
        OrganizationNotFound: "The organization was not found.",
        OrganizationAlreadyExists: "This organization is already registered.",
        OrganizationAlreadyVerified: "This organization is already verified.",
        DuplicateRequest: "A verification request for this entry already exists.",
        InvalidAddress: "The provided address is invalid.",
        // Add more mappings as needed
      };
      return errorMap[match[1]] || match[1];
    }

    // User rejected transaction (MetaMask, etc.)
    if (error.message.toLowerCase().includes("user rejected")) {
      return "You rejected the transaction.";
    }
    if (error.message.includes("User denied transaction signature")) {
      return "You denied the transaction signature.";
    }
    if (error.message.includes("insufficient funds")) {
      return "You do not have enough ETH to complete this transaction.";
    }
    // Add more as needed
    return error.message;
  }

  // Viem/wagmi error cause
  if (error.cause && typeof error.cause.message === "string") {
    return parseError(error.cause);
  }

  // Fallback
  return String(error);
} 