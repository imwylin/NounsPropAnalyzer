import { useClient } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'
import { NOUNS_DAO_ABI, NOUNS_DAO_ADDRESS } from './NounsDAOProxy'
import { createConfig, http } from 'wagmi'

// Configure wagmi client
export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http()
  },
  ssr: true
})

// Configure React Query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 3_600_000, // 1 hour cache time
      staleTime: 300_000, // 5 minutes before refetch
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
})

// Export contract constants for reuse
export const nounsDAOContract = {
  address: NOUNS_DAO_ADDRESS,
  abi: NOUNS_DAO_ABI
} as const 