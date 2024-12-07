export interface BaseTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  input: string;
  contractAddress: string;
  type: 'normal' | 'internal' | 'erc20' | 'erc721' | 'erc1155';
  isError?: string;
  txreceipt_status?: string;
  methodId?: string;
  functionName?: string;
  nonce?: string;
}

export interface Transaction extends BaseTransaction {
  blockHash: string;
  transactionIndex: string;
  cumulativeGasUsed: string;
  confirmations: string;
}

export interface InternalTransaction extends BaseTransaction {
  traceId: string;
  errCode: string;
}

export interface ERC20Transfer extends BaseTransaction {
  blockHash: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  cumulativeGasUsed: string;
  confirmations: string;
}

export interface ERC721Transfer extends BaseTransaction {
  blockHash: string;
  tokenID: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  cumulativeGasUsed: string;
  confirmations: string;
}

export interface ERC1155Transfer extends BaseTransaction {
  blockHash: string;
  tokenID: string;
  tokenValue: string;
  tokenName: string;
  tokenSymbol: string;
  transactionIndex: string;
  cumulativeGasUsed: string;
  confirmations: string;
} 