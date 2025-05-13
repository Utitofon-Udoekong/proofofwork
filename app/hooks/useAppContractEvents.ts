import { useWatchContractEvent } from 'wagmi'
import { contractAddresses } from '@/app/lib/contracts/addresses'
import { VerificationManager__factory, ResumeNFT__factory } from '@/app/lib/contracts/contract-types'

export function useAppContractEvents(onEvent: (eventName: string, args: any, contract: string) => void) {
  const verificationEvents = [
    'OrganizationAdded',
    'OrganizationVerified',
    'OrganizationRevoked',
    'OrganizationRemoved',
    'RequestCreated',
    'RequestApproved',
    'RequestRejected',
  ];

  verificationEvents.forEach(eventName => {
    useWatchContractEvent({
      address: contractAddresses.verificationManager as `0x${string}`,
      abi: VerificationManager__factory.abi,
      eventName: eventName as 'OrganizationAdded' | 'OrganizationVerified' | 'OrganizationRevoked' | 'OrganizationRemoved' | 'RequestCreated' | 'RequestApproved' | 'RequestRejected',
      onLogs(log) {
        onEvent(eventName, log, 'VerificationManager');
      },
    });
  });

  useWatchContractEvent({
    address: contractAddresses.resumeNFT as `0x${string}`,
    abi: ResumeNFT__factory.abi,
    eventName: 'Transfer',
    onLogs(log) {
      onEvent('Transfer', log, 'ResumeNFT');
    },
  });
} 