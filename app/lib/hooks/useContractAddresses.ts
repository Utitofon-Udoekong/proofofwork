import { contractAddresses } from '../contracts/addresses';
import { ContractAddresses } from '../types';

/**
 * Hook to access contract addresses in the frontend
 * @returns The contract addresses for the deployed contracts
 */
export function useContractAddresses(): ContractAddresses {
  return contractAddresses;
}

export default useContractAddresses; 