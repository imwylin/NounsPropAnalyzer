import { Database } from '../../../lib/db/index';
import { getMonitoredContracts, ContractConfig } from '../types/contracts';
import type { Contract, SyncStatus } from '../../../lib/types';
import type { BaseTransaction } from '../types/etherscan';
import { neon } from '@neondatabase/serverless';

const sql = typeof window === 'undefined' ? neon(process.env.DATABASE_URL!) : null;

export interface ContractStatus {
  contract: ContractConfig;
  status: SyncStatus | null;
}

export async function getContractStatus(address: string): Promise<SyncStatus | null> {
  return Database.getSyncStatus(address);
}

export async function getAllContractStatus(): Promise<ContractStatus[]> {
  const contracts = await getMonitoredContracts();
  return Promise.all(
    contracts.map(async (contract: ContractConfig) => ({
      contract,
      status: await Database.getSyncStatus(contract.address)
    }))
  );
}

export async function getContractData(address: string): Promise<Contract | null> {
  return Database.getContract(address);
}

interface TransactionRow {
  hash: string;
  block_number: string;
  time_stamp: string;
  from: string;
  to: string;
  value: string;
  type: string;
  gas: string;
  gas_price: string;
  gas_used: string;
  input: string;
  contract_address: string;
  is_error?: string;
  txreceipt_status?: string;
  method_id?: string;
  function_name?: string;
  nonce?: string;
  token_symbol?: string;
  token_name?: string;
  token_decimal?: string;
  token_value?: string;
  token_id?: string;
}

// Cache for transaction results
const transactionCache = new Map<string, {
  timestamp: number;
  data: {
    transactions: BaseTransaction[];
    pagination: {
      page: number;
      totalPages: number;
      total: number;
    };
  };
}>();

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Maximum transactions per page for different query types
const MAX_REGULAR_PAGE_SIZE = 100;
const MAX_ANALYSIS_PAGE_SIZE = 1000;

// In-flight requests cache to prevent duplicate requests
const inFlightRequests = new Map<string, Promise<{
  transactions: BaseTransaction[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}>>();

// Generate cache key from request parameters
function getCacheKey(address: string, page: number, limit: number, timeRange?: { start?: number; end?: number }): string {
  return JSON.stringify({
    address: address.toLowerCase(),
    page,
    limit,
    timeRange: timeRange ? {
      start: timeRange.start || null,
      end: timeRange.end || null
    } : null
  });
}

export async function getContractTransactions(
  address: string,
  page: number = 1,
  requestedLimit: number = 50,
  timeRange?: { start?: number; end?: number }
): Promise<{
  transactions: BaseTransaction[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}> {
  try {
    if (typeof window !== 'undefined') {
      throw new Error('This function can only be called from the server side');
    }
    if (!sql) {
      throw new Error('Database connection not initialized');
    }

    // Normalize the address for consistency
    const normalizedAddress = address.toLowerCase();
    
    // Generate cache key
    const cacheKey = getCacheKey(normalizedAddress, page, requestedLimit, timeRange);

    // Check if there's an in-flight request
    const inFlightRequest = inFlightRequests.get(cacheKey);
    if (inFlightRequest) {
      console.log('Returning in-flight request result');
      return inFlightRequest;
    }

    // Check cache first
    const cached = transactionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached transactions');
      return cached.data;
    }

    // Create the request promise
    const requestPromise = (async () => {
      console.log(`Fetching transactions for address: ${normalizedAddress}, page: ${page}, requestedLimit: ${requestedLimit}, timeRange:`, timeRange);

      // Build the base query
      const params = [normalizedAddress];
      let whereClause = '("from" = $1 OR "to" = $1 OR contract_address = $1)';

      // Only add time range conditions if timeRange is provided (for analysis)
      if (timeRange) {
        if (timeRange.start) {
          params.push(timeRange.start.toString());
          whereClause += ` AND CAST(time_stamp AS bigint) >= $${params.length}`;
        }
        if (timeRange.end) {
          params.push(timeRange.end.toString());
          whereClause += ` AND CAST(time_stamp AS bigint) <= $${params.length}`;
        }
      }

      // Determine the appropriate limit based on the request type
      const isAnalysisQuery = requestedLimit > MAX_REGULAR_PAGE_SIZE;
      const limit = isAnalysisQuery 
        ? Math.min(requestedLimit, MAX_ANALYSIS_PAGE_SIZE)
        : Math.min(requestedLimit, MAX_REGULAR_PAGE_SIZE);
      
      const offset = (page - 1) * limit;
      params.push(limit.toString(), offset.toString());

      // Use a CTE for better query performance
      const selectQuery = `
        WITH filtered_transactions AS (
          SELECT * FROM transactions 
          WHERE ${whereClause}
          ORDER BY CAST(time_stamp AS bigint) DESC
        )
        SELECT * FROM filtered_transactions
        LIMIT $${params.length - 1}
        OFFSET $${params.length}
      `;

      const countQuery = `
        SELECT COUNT(*) as count 
        FROM transactions 
        WHERE ${whereClause}
      `;

      console.log('Executing queries:', {
        selectQuery,
        countQuery,
        params: params.map((p, i) => `$${i + 1}: ${p}`)
      });

      const [txResult, countResult] = await Promise.all([
        sql(selectQuery, params)
          .then(result => {
            console.log(`Found ${result.length} transactions`);
            return result as TransactionRow[];
          }),
        sql(countQuery, params.slice(0, -2))
          .then(result => {
            console.log(`Total count:`, result);
            return result as Array<{ count: string }>;
          })
      ]);

      const total = parseInt(countResult[0].count);
      const totalPages = Math.ceil(total / limit);

      console.log('Query results:', {
        total,
        currentPage: page,
        transactionsFound: txResult.length,
        requestedLimit,
        actualLimit: limit,
        timeRange
      });

      const transactions = txResult.map(mapTransactionRow);

      const result = {
        transactions,
        pagination: {
          page,
          totalPages,
          total
        }
      };

      // Cache the result
      transactionCache.set(cacheKey, {
        timestamp: Date.now(),
        data: result
      });

      return result;
    })();

    // Store the request promise
    inFlightRequests.set(cacheKey, requestPromise);

    // Clean up in-flight request after it completes
    requestPromise.finally(() => {
      inFlightRequests.delete(cacheKey);
    });

    return requestPromise;
  } catch (error) {
    console.error('Error in getContractTransactions:', error);
    throw error;
  }
}

// Helper function to map database rows to BaseTransaction type
function mapTransactionRow(tx: TransactionRow): BaseTransaction {
  return {
    hash: tx.hash,
    blockNumber: tx.block_number,
    timeStamp: tx.time_stamp,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    type: tx.type as BaseTransaction['type'],
    gas: tx.gas,
    gasPrice: tx.gas_price,
    gasUsed: tx.gas_used,
    input: tx.input,
    contractAddress: tx.contract_address,
    isError: tx.is_error,
    txreceipt_status: tx.txreceipt_status,
    methodId: tx.method_id,
    functionName: tx.function_name,
    nonce: tx.nonce,
    ...(tx.token_symbol ? {
      tokenSymbol: tx.token_symbol,
      tokenName: tx.token_name,
      tokenDecimal: tx.token_decimal,
      tokenValue: tx.token_value,
      tokenID: tx.token_id
    } : {})
  };
} 