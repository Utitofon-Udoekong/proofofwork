import { useQuery } from '@tanstack/react-query';
import { useWeb3 } from '@/app/providers/Web3Provider';

export function useOrganizationDetails(address?: string) {
  const { getOrganizationDetails } = useWeb3();
  return useQuery({
    queryKey: ['organizationDetails', address],
    queryFn: () => getOrganizationDetails(address!),
    enabled: !!address,
  });
} 