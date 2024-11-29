export interface ContractConfig {
  address: string;
  name: string;
  description: string;
  type: 'treasury' | 'token_buyer' | 'payer' | 'auction';
}

export const MONITORED_CONTRACTS: ContractConfig[] = [
  {
    address: '0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71',
    name: 'Treasury',
    description: 'Executor/Timelock - Main treasury contract',
    type: 'treasury',
  },
  {
    address: '0x4f2acdc74f6941390d9b1804fabc3e780388cfe5',
    name: 'Token Buyer',
    description: 'ETH → USDC Conversion Contract',
    type: 'token_buyer',
  },
  {
    address: '0xd97Bcd9f47cEe35c0a9ec1dc40C1269afc9E8E1D',
    name: 'USDC Payer',
    description: 'USDC Payment Distribution Contract',
    type: 'payer',
  },
  {
    address: '0x830BD73E4184ceF73443C15111a1DF14e495C706',
    name: 'Auction House',
    description: 'Nouns NFT Auction Contract',
    type: 'auction',
  },
];

// Helper function to identify contract type
export function getContractType(address: string): string {
  const contract = MONITORED_CONTRACTS.find(
    c => c.address.toLowerCase() === address.toLowerCase()
  );
  return contract?.type || 'unknown';
} 