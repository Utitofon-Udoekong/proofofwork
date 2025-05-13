import { useQuery } from '@tanstack/react-query'
import { useWeb3 } from '@/app/providers/Web3Provider'

export function useOrganizations() {
  const { getOrganizations } = useWeb3();
  return useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  });
} 