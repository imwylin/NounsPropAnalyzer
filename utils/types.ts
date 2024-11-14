export interface TokenBalance {
  token_address: string;
  symbol: string;
  name: string;
  logo: string | null;
  decimals: number;
  balance: string;
  balance_formatted: string;
  usd_price: number | null;
  usd_value: number | null;
  possible_spam: boolean;
  verified_contract: boolean;
  native_token: boolean;
}

export interface NativeTransfer {
  from_address: string;
  to_address: string;
  value: string;
  value_formatted: string;
}

export interface NFTTransfer {
  token_address: string;
  token_id: string;
  from_address: string;
  to_address: string;
  amount: string;
  contract_type: string;
}

export interface ERC20Transfer {
  token_address: string;
  token_symbol: string;
  value: string;
  value_formatted: string;
  from_address: string;
}

export interface Transaction {
  hash: string;
  from_address: string;
  to_address: string;
  block_timestamp: string;
  value: string;
  native_transfers?: NativeTransfer[];
  nft_transfers?: NFTTransfer[];
  erc20_transfers?: ERC20Transfer[];
  type?: 'auction' | 'treasury' | 'tokenBuyer' | 'usdcPayer';
  category?: string;
  description?: string;
  contractDetails?: string;
  direction?: string;
  source?: string;
  isAuctionSettlement?: boolean;
}

export interface ProcessedTransaction extends Transaction {
  type: 'auction' | 'treasury' | 'tokenBuyer' | 'usdcPayer';
  category: string;
  description: string;
  source: string;
  value: string;
} 