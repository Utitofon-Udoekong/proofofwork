import { useQuery } from '@tanstack/react-query'
import { useWeb3 } from '@/app/providers/Web3Provider'

export function useResumes() {
  const { getResumes } = useWeb3();
  return useQuery({
    queryKey: ['resumes'],
    queryFn: getResumes,
  });
} 