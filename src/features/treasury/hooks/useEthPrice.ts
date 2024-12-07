import { useQuery } from '@tanstack/react-query';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export function useEthPrice() {
  return useQuery({
    queryKey: ['ethPrice'],
    queryFn: async () => {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=ethereum&vs_currencies=usd`
      );
      const data = await response.json();
      return data.ethereum.usd as number;
    },
    staleTime: 60 * 1000, // Price data considered fresh for 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
} 