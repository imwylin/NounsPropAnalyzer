import { ContractConfig } from './contracts';

// Core types from Etherscan API
export interface EtherscanTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  input: string;
  type: string;
  gas: string;
  gasUsed: string;
  traceId: string;
  isError: string;
  errCode: string;
  // Token specific fields
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
  // NFT specific fields
  tokenID?: string;
  // Method info
  methodId?: string;
  functionName?: string;
  // Our custom fields added during normalization
  transactionType?: 'normal' | 'token' | 'internal' | 'nft';
}

// Enhanced types for our application
export interface EnhancedTransaction extends EtherscanTransaction {
  contractName: string;
}

export interface NounTransaction extends EnhancedTransaction {
  nounId: string;
  isNounderNoun?: boolean;
  isMint?: boolean;
}

export interface USDCTransaction extends EnhancedTransaction {
  amount: string;
  decimals: number;
}

// Contract and Treasury data types
export interface ContractData {
  transactions: EtherscanTransaction[];
  balances: {
    eth: string;
    usdc: string;
  };
  contractType: string;
  contractName: string;
  lastUpdated: number;
}

export interface RawTreasuryData {
  [address: string]: ContractData;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface ContractCache {
  transactions?: CacheEntry<EtherscanTransaction[]>;
  balances?: CacheEntry<{
    eth: string;
    usdc: string;
  }>;
}

// Query parameters based on Etherscan API
export interface TransactionQuery {
  address: string;
  startblock?: number;
  endblock?: number;
  page?: number;
  offset?: number;
  sort?: 'asc' | 'desc';
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  contractTypes?: ('treasury' | 'token_buyer' | 'payer' | 'auction')[];
}

// Treasury data types
export interface TreasuryData {
  nounTransactions: NounTransaction[];
  usdcTransactions: USDCTransaction[];
  ethTransactions: EnhancedTransaction[];
  balances: {
    eth: string;
    usdc: string;
  };
} 