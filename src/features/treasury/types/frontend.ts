export interface FrontendNFTHolding {
  tokenId: string;
  tokenQuantity: string;
  contractAddress: string;
  name?: string;
  symbol?: string;
}

export interface FrontendTransaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  type: 'normal' | 'internal' | 'erc20' | 'erc721' | 'erc1155';
  gas: string;
  gasPrice: string;
  gasUsed: string;
  input: string;
  contractAddress: string;
  isError?: string;
  txreceipt_status?: string;
  methodId?: string;
  functionName?: string;
  nonce?: string;
  tokenData?: {
    symbol: string;
    amount: string;
    tokenName?: string;
    tokenDecimal?: string;
    tokenID?: string;
  };
}

export interface ContractDetails extends FrontendContract {
  transactions: {
    normal: FrontendTransaction[];
    internal: FrontendTransaction[];
    erc20: FrontendTransaction[];
    erc721: FrontendTransaction[];
    erc1155: FrontendTransaction[];
  };
  syncStatus?: {
    inProgress: boolean;
    stage: string;
    progress: number;
    lastSync: Date | null;
    error: string | null;
    lastSyncedBlock: string | null;
  };
}

export interface FrontendContract {
  address: string;
  name: string;
  type: string;
  balance: string;
  tokenHoldings: {
    contractAddress: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDecimal: string;
    balance: string;
  }[];
  nftHoldings: FrontendNFTHolding[];
  lastSync: Date;
  metadata: {
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
  };
} 