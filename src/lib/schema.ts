import { pgTable, text, timestamp, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';

interface TokenHolding {
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  balance: string;
}

interface NFTHolding {
  tokenId: string;
  tokenQuantity: string;
  contractAddress: string;
  name?: string;
  symbol?: string;
}

interface ContractMetadata {
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

export const contracts = pgTable('contracts', {
  address: text('address').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  balance: text('balance').notNull(),
  tokenHoldings: jsonb('token_holdings').notNull().$type<TokenHolding[]>(),
  nftHoldings: jsonb('nft_holdings').notNull().$type<NFTHolding[]>(),
  lastSync: timestamp('last_sync').notNull(),
  metadata: jsonb('metadata').notNull().$type<ContractMetadata>()
}, (table) => ({
  lastSyncIdx: index('contracts_last_sync_idx').on(table.lastSync)
}));

export type TransactionType = 'normal' | 'internal' | 'erc20' | 'erc721' | 'erc1155';

export const transactions = pgTable('transactions', {
  hash: text('hash').primaryKey(),
  contractAddress: text('contract_address').notNull().references(() => contracts.address),
  blockNumber: text('block_number').notNull(),
  timeStamp: text('time_stamp').notNull(),
  from: text('from').notNull(),
  to: text('to').notNull(),
  value: text('value').notNull(),
  type: text('type').notNull().$type<TransactionType>(),
  gas: text('gas').notNull(),
  gasPrice: text('gas_price').notNull(),
  gasUsed: text('gas_used').notNull(),
  input: text('input').notNull(),
  isError: text('is_error'),
  txreceipt_status: text('txreceipt_status'),
  methodId: text('method_id'),
  functionName: text('function_name'),
  nonce: text('nonce'),
  // Token-specific fields
  tokenSymbol: text('token_symbol'),
  tokenName: text('token_name'),
  tokenDecimal: text('token_decimal'),
  tokenValue: text('token_value'),
  tokenID: text('token_id')
}, (table) => ({
  contractAddressIdx: index('transactions_contract_address_idx').on(table.contractAddress),
  timestampIdx: index('transactions_timestamp_idx').on(table.timeStamp)
}));

export const syncStatus = pgTable('sync_status', {
  contractAddress: text('contract_address').primaryKey().references(() => contracts.address),
  inProgress: boolean('in_progress').notNull(),
  stage: text('stage').notNull(),
  progress: integer('progress').notNull(),
  lastSync: timestamp('last_sync'),
  error: text('error'),
  lastSyncedBlock: text('last_synced_block')
}, (table) => ({
  inProgressIdx: index('sync_status_in_progress_idx').on(table.inProgress),
  lastSyncIdx: index('sync_status_last_sync_idx').on(table.lastSync)
})); 