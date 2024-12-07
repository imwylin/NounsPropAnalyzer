export interface TokenHolding {
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  balance: string;
}

export interface NFTHolding {
  tokenId: string;
  tokenQuantity: string;
  contractAddress: string;
  name?: string;
  symbol?: string;
}

export interface ContractMetadata {
  lastSyncTime: number;
  transactionCounts: {
    normal: number;
    internal: number;
    erc20: number;
    erc721: number;
    erc1155: number;
  };
  isComplete: boolean;
  lastSyncBlock: string;
  oldestSyncedBlock: string;
}

export interface Contract {
  address: string;
  name: string;
  type: string;
  balance: string;
  tokenHoldings: TokenHolding[];
  nftHoldings: NFTHolding[];
  lastSync: Date;
  metadata: ContractMetadata;
  syncStatus?: SyncStatus;
}

export interface SyncStatus {
  contractAddress: string;
  inProgress: boolean;
  stage: string;
  progress: number;
  lastSync: Date | null;
  error: string | null;
  lastSyncedBlock: string | null;
}

export interface APIResponse {
  contracts: Contract[];
  lastSync: number;
  error: string | null;
} 