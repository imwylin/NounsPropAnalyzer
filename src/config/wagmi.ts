import { mainnet } from 'viem/chains'
import { http } from 'wagmi'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { NOUNS_DAO_ABI, NOUNS_DAO_ADDRESS } from '../features/governance/config/NounsDAOProxy'

if (!process.env.NEXT_PUBLIC_WALLETCONNECT_ID) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_ID environment variable is not set');
}

if (!process.env.NEXT_PUBLIC_RPC_URL) {
  throw new Error('NEXT_PUBLIC_RPC_URL environment variable is not set');
}

// Configure wagmi client
export const config = getDefaultConfig({
  appName: 'Nouns 501c3 Analysis',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID!,
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_RPC_URL}`)
  },
  ssr: true
})

// Export contract constants for reuse
export const nounsDAOContract = {
  address: NOUNS_DAO_ADDRESS,
  abi: NOUNS_DAO_ABI
} as const 