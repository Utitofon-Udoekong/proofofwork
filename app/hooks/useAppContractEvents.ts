import { useWatchContractEvent } from 'wagmi'
import { contractAddresses } from '@/app/lib/contracts/addresses'
import { VerificationManager__factory, ResumeNFT__factory } from '@/app/lib/contracts/contract-types'
import type { Log } from 'viem'

export function useAppContractEvents(onEvent: (eventName: string, logs: Log[], contract: string) => void) {
  // List of verification events
  useWatchContractEvent({
    address: contractAddresses.verificationManager as `0x${string}`,
    abi: VerificationManager__factory.abi,
    eventName: 'OrganizationAdded',
    onLogs(logs) {
      onEvent('OrganizationAdded', logs, 'VerificationManager');
    },
  });
  useWatchContractEvent({
    address: contractAddresses.verificationManager as `0x${string}`,
    abi: VerificationManager__factory.abi,
    eventName: 'OrganizationVerified',
    onLogs(logs) {
      onEvent('OrganizationVerified', logs, 'VerificationManager');
    },
  });
  useWatchContractEvent({
    address: contractAddresses.verificationManager as `0x${string}`,
    abi: VerificationManager__factory.abi,
    eventName: 'OrganizationRevoked',
    onLogs(logs) {
      onEvent('OrganizationRevoked', logs, 'VerificationManager');
    },
  });
  useWatchContractEvent({
    address: contractAddresses.verificationManager as `0x${string}`,
    abi: VerificationManager__factory.abi,
    eventName: 'OrganizationRemoved',
    onLogs(logs) {
      onEvent('OrganizationRemoved', logs, 'VerificationManager');
    },
  });
  useWatchContractEvent({
    address: contractAddresses.verificationManager as `0x${string}`,
    abi: VerificationManager__factory.abi,
    eventName: 'RequestCreated',
    onLogs(logs) {
      onEvent('RequestCreated', logs, 'VerificationManager');
    },
  });
  useWatchContractEvent({
    address: contractAddresses.verificationManager as `0x${string}`,
    abi: VerificationManager__factory.abi,
    eventName: 'RequestApproved',
    onLogs(logs) {
      onEvent('RequestApproved', logs, 'VerificationManager');
    },
  });
  useWatchContractEvent({
    address: contractAddresses.verificationManager as `0x${string}`,
    abi: VerificationManager__factory.abi,
    eventName: 'RequestRejected',
    onLogs(logs) {
      onEvent('RequestRejected', logs, 'VerificationManager');
    },
  });

  useWatchContractEvent({
    address: contractAddresses.resumeNFT as `0x${string}`,
    abi: ResumeNFT__factory.abi,
    eventName: 'Transfer',
    onLogs(logs) {
      onEvent('Transfer', logs, 'ResumeNFT');
    },
  });
} 