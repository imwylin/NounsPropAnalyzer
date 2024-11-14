export const ADDRESSES = {
  TREASURY: '0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71',
  AUCTION_HOUSE: '0x830BD73E4184ceF73443C15111a1DF14e495C706',
  NOUNS_TOKEN: '0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03',
  TOKEN_BUYER: '0x4f2acdc74f6941390d9b1804fabc3e780388cfe5',
  USDC_PAYER: '0xd97Bcd9f47cEe35c0a9ec1dc40C1269afc9E8E1D',
  DAO: '0x6f3E6272A167e8AcCb32072d08E0957F9c79223d',
  DAO_EXECUTOR: '0x0BC3807Ec262cB779b38D65b38158acC3bfedE10',
  DAO_EXECUTOR_PROXY: '0xa43aFE317985726E4e194eb061Af77fbCb43F944'
};

export const KNOWN_CONTRACTS: { [key: string]: string } = {
  [ADDRESSES.DAO]: 'Nouns DAO',
  [ADDRESSES.AUCTION_HOUSE]: 'Nouns Auction House',
  [ADDRESSES.NOUNS_TOKEN]: 'Nouns Token',
  [ADDRESSES.DAO_EXECUTOR]: 'Nouns DAO Executor',
  [ADDRESSES.DAO_EXECUTOR_PROXY]: 'Nouns DAO Executor Proxy',
  [ADDRESSES.TOKEN_BUYER]: 'Token Buyer',
  [ADDRESSES.USDC_PAYER]: 'USDC Payer'
};

export function getContractDetails(address: string): string {
  return KNOWN_CONTRACTS[address.toLowerCase()] || 'Unknown Contract';
} 