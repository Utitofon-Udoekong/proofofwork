import { useQuery } from '@tanstack/react-query'
import { useWeb3 } from '@/app/providers/Web3Provider'

export function usePendingVerificationRequests() {
  const { getPendingVerificationRequests } = useWeb3();
  return useQuery({
    queryKey: ['pendingVerificationRequests'],
    queryFn: getPendingVerificationRequests,
  });
} 