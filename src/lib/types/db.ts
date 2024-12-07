import type { TransactionType } from '../schema';

export interface TransactionInsert {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  type: TransactionType;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  input: string;
  contractAddress: string;
  isError: string | null;
  txreceipt_status: string | null;
  methodId: string | null;
  functionName: string | null;
  nonce: string | null;
  tokenSymbol: string | null;
  tokenName: string | null;
  tokenDecimal: string | null;
  tokenValue: string | null;
  tokenID: string | null;
} 