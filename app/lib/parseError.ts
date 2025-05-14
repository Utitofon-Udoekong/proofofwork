// Utility to parse errors from contract calls and other sources
export function parseError(error: unknown): string {
  if (!error) return "Unknown error occurred.";

  if (hasMessage(error)) {
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
  if (hasCause(error) && hasMessage((error as { cause: unknown }).cause)) {
    return parseError((error as { cause: unknown }).cause);
  }

  // Fallback
  return String(error);
}

function hasMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string';
}

function hasCause(error: unknown): error is { cause: unknown } {
  return typeof error === 'object' && error !== null && 'cause' in error;
} 