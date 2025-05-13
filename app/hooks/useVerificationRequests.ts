import { useQuery } from '@tanstack/react-query'
import { useWeb3 } from '@/app/providers/Web3Provider'

export function useVerificationRequests() {
  const { getUserVerificationRequests } = useWeb3();
  return useQuery({
    queryKey: ['verificationRequests'],
    queryFn: getUserVerificationRequests,
  });
} 