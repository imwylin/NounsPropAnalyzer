import { Transaction as EtherscanTransaction } from './etherscan';
import { ContractConfig } from './contracts';

// Base types
export type Transaction = EtherscanTransaction;

// Raw data streams
export interface RawContractData {
  transactions: Transaction[];
  balances: {
    eth: string;
    usdc: string;
  };
}

export interface RawTreasuryData {
  [contractAddress: string]: RawContractData;
}

// Enhanced transaction types
export interface EnhancedTransaction extends Transaction {
  contractAddress: string;
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

// Processed data structure
export interface TreasuryData {
  nounTransactions: NounTransaction[];
  usdcTransactions: USDCTransaction[];
  ethTransactions: EnhancedTransaction[];
  balances: {
    eth: string;
    usdc: string;
  };
}

// Query types for filtering
export interface TransactionQuery {
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  contractTypes?: ('treasury' | 'token_buyer' | 'payer' | 'auction')[];
  transactionTypes?: ('eth' | 'usdc' | 'noun')[];
  status?: 'success' | 'failed' | 'all';
}

// Add to your existing types
export interface CachedData {
  transactions: Transaction[];
  balances: {
    eth: string;
    usdc: string;
  };
  contractType: 'treasury' | 'token_buyer' | 'payer' | 'auction';
  contractName: string;
  lastUpdated: number;
}

export interface EdgeConfigData {
  [key: string]: CachedData;
} 