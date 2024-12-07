import { neon, neonConfig } from '@neondatabase/serverless';
import type { Contract, SyncStatus } from '../types';
import { NFTHolding as DBNFTHolding } from '../types';
import { FrontendNFTHolding } from '../../features/treasury/types/frontend';
import type { 
  BaseTransaction,
  ERC20Transfer,
  ERC721Transfer,
  ERC1155Transfer
} from '../../features/treasury/types/etherscan';
import { MONITORED_CONTRACTS } from '../../features/treasury/types/contracts';

// Configure Neon connection management
neonConfig.wsProxy = (host, port) => `wss://${host}:${port}`;
neonConfig.pipelineConnect = "password";
neonConfig.useSecureWebSocket = true;

// Ensure this code only runs on the server side
const sql = typeof window === 'undefined' ? neon(process.env.DATABASE_URL!) : null;

// Helper function to ensure dates are properly handled
function ensureDate(date: Date | string | null | undefined): Date {
  if (!date) return new Date();
  return date instanceof Date ? date : new Date(date);
}

// Database class with static methods
export class Database {
  private static ensureServerSide() {
    if (typeof window !== 'undefined') {
      throw new Error('Database operations can only be performed on the server side.');
    }
    if (!sql) {
      throw new Error('Database connection not initialized.');
    }
  }

  static async getContract(address: string): Promise<Contract | null> {
    this.ensureServerSide();
    const result = await sql!`
      SELECT c.*, s.* 
      FROM contracts c 
      LEFT JOIN sync_status s ON c.address = s.contract_address 
      WHERE c.address = ${address}
    `;

    if (!result[0]) return null;
    
    const contract = result[0];
    return {
      address: contract.address,
      name: contract.name,
      type: contract.type,
      balance: contract.balance,
      tokenHoldings: contract.token_holdings,
      nftHoldings: contract.nft_holdings.map(convertNFTHolding),
      lastSync: ensureDate(contract.last_sync),
      metadata: contract.metadata,
      syncStatus: contract.contract_address ? {
        contractAddress: contract.contract_address,
        inProgress: contract.in_progress,
        stage: contract.stage,
        progress: contract.progress,
        lastSync: ensureDate(contract.last_sync),
        error: contract.error,
        lastSyncedBlock: contract.last_synced_block
      } : undefined
    };
  }

  static async updateContract(address: string, data: Partial<Contract>): Promise<void> {
    this.ensureServerSide();

    // Get existing contract data
    const existingContract = await this.getContract(address);

    console.log('Updating contract with data:', {
      address,
      name: data.name,
      type: data.type,
      existingContract: existingContract ? {
        name: existingContract.name,
        type: existingContract.type
      } : null
    });

    // Prepare token holdings - ensure we don't duplicate tokens
    const tokenHoldings = data.tokenHoldings?.map(token => ({
      ...token,
      contractAddress: token.contractAddress.toLowerCase() // Normalize address
    }));

    // Ensure we don't override existing values with empty strings
    const name = data.name !== undefined ? data.name : (existingContract?.name || '');
    const type = data.type !== undefined ? data.type : (existingContract?.type || '');

    try {
      await sql!`
        INSERT INTO contracts (
          address,
          name,
          type,
          balance,
          token_holdings,
          nft_holdings,
          last_sync,
          metadata
        ) VALUES (
          ${address},
          ${name},
          ${type},
          ${data.balance || '0'},
          ${JSON.stringify(tokenHoldings || [])},
          ${JSON.stringify(data.nftHoldings || [])},
          ${ensureDate(data.lastSync)},
          ${JSON.stringify(data.metadata || {
            lastSyncTime: Date.now(),
            transactionCounts: {
              normal: 0,
              internal: 0,
              erc20: 0,
              erc721: 0,
              erc1155: 0
            },
            isComplete: false,
            lastSyncBlock: '0',
            oldestSyncedBlock: '0'
          })}
        )
        ON CONFLICT (address) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          balance = EXCLUDED.balance,
          token_holdings = EXCLUDED.token_holdings,
          nft_holdings = EXCLUDED.nft_holdings,
          last_sync = EXCLUDED.last_sync,
          metadata = EXCLUDED.metadata
      `;

      // Verify the update
      const updatedContract = await this.getContract(address);
      console.log('Contract after update:', {
        address,
        name: updatedContract?.name,
        type: updatedContract?.type
      });
    } catch (error) {
      console.error('Error updating contract:', error);
      throw error;
    }
  }

  static async saveTransaction(tx: BaseTransaction): Promise<void> {
    this.ensureServerSide();

    // Ensure contract exists before saving transaction
    await this.ensureContractExists(tx.contractAddress);

    await sql!`
      INSERT INTO transactions (
        hash,
        contract_address,
        block_number,
        time_stamp,
        "from",
        "to",
        value,
        type,
        gas,
        gas_price,
        gas_used,
        input,
        is_error,
        txreceipt_status,
        method_id,
        function_name,
        nonce,
        token_symbol,
        token_name,
        token_decimal,
        token_value,
        token_id
      ) VALUES (
        ${tx.hash},
        ${tx.contractAddress},
        ${tx.blockNumber},
        ${tx.timeStamp},
        ${tx.from},
        ${tx.to},
        ${tx.value},
        ${tx.type},
        ${tx.gas},
        ${tx.gasPrice},
        ${tx.gasUsed},
        ${tx.input},
        ${tx.isError || null},
        ${tx.txreceipt_status || null},
        ${tx.methodId || null},
        ${tx.functionName || null},
        ${tx.nonce || null},
        ${tx.type === 'erc20' || tx.type === 'erc721' || tx.type === 'erc1155' 
          ? (tx as ERC20Transfer | ERC721Transfer | ERC1155Transfer).tokenSymbol 
          : null},
        ${tx.type === 'erc20' || tx.type === 'erc721' || tx.type === 'erc1155'
          ? (tx as ERC20Transfer | ERC721Transfer | ERC1155Transfer).tokenName
          : null},
        ${tx.type === 'erc20' || tx.type === 'erc721'
          ? (tx as ERC20Transfer | ERC721Transfer).tokenDecimal
          : null},
        ${tx.type === 'erc1155'
          ? (tx as ERC1155Transfer).tokenValue
          : null},
        ${tx.type === 'erc721' || tx.type === 'erc1155'
          ? (tx as ERC721Transfer | ERC1155Transfer).tokenID
          : null}
      )
      ON CONFLICT (hash) DO NOTHING
    `;
  }

  private static async ensureContractExists(address: string): Promise<void> {
    const contract = await this.getContract(address);
    if (!contract) {
      // Only initialize if it's a monitored contract
      const monitoredContract = Object.values(MONITORED_CONTRACTS).find(
        c => c.address.toLowerCase() === address.toLowerCase()
      );
      
      if (monitoredContract) {
        // Initialize with monitored contract data
        await this.updateContract(address, {
          address: monitoredContract.address,
          name: monitoredContract.name,
          type: monitoredContract.type,
          balance: '0',
          tokenHoldings: [],
          nftHoldings: [],
          lastSync: new Date(),
          metadata: {
            lastSyncTime: Date.now(),
            transactionCounts: {
              normal: 0,
              internal: 0,
              erc20: 0,
              erc721: 0,
              erc1155: 0
            },
            isComplete: false,
            lastSyncBlock: '0',
            oldestSyncedBlock: '0'
          }
        });
      }
    }
  }

  static async getSyncStatus(address: string): Promise<SyncStatus | null> {
    this.ensureServerSide();
    const result = await sql!`
      SELECT * FROM sync_status 
      WHERE contract_address = ${address}
    `;
    
    if (!result[0]) return null;

    // Map the database result to the SyncStatus type
    return {
      contractAddress: result[0].contract_address,
      inProgress: result[0].in_progress,
      stage: result[0].stage,
      progress: result[0].progress,
      lastSync: ensureDate(result[0].last_sync),
      error: result[0].error,
      lastSyncedBlock: result[0].last_synced_block
    };
  }

  static async updateSyncStatus(address: string, data: Partial<SyncStatus>): Promise<void> {
    this.ensureServerSide();
    const updateData = {
      inProgress: data.inProgress ?? false,
      stage: data.stage || 'initialized',
      progress: data.progress ?? 0,
      lastSync: ensureDate(data.lastSync),
      error: data.error || null,
      lastSyncedBlock: data.lastSyncedBlock || null
    };

    await sql!`
      INSERT INTO sync_status (
        contract_address,
        in_progress,
        stage,
        progress,
        last_sync,
        error,
        last_synced_block
      ) VALUES (
        ${address},
        ${updateData.inProgress},
        ${updateData.stage},
        ${updateData.progress},
        ${updateData.lastSync},
        ${updateData.error},
        ${updateData.lastSyncedBlock}
      )
      ON CONFLICT (contract_address) DO UPDATE SET
        in_progress = EXCLUDED.in_progress,
        stage = EXCLUDED.stage,
        progress = EXCLUDED.progress,
        last_sync = EXCLUDED.last_sync,
        error = EXCLUDED.error,
        last_synced_block = EXCLUDED.last_synced_block
    `;
  }

  static async clearAllSyncLocks(): Promise<void> {
    this.ensureServerSide();
    await sql!`
      UPDATE sync_status 
      SET in_progress = false, 
          error = null
    `;
  }
}

// Helper function
function convertNFTHolding(holding: DBNFTHolding): FrontendNFTHolding {
  return {
    tokenId: holding.tokenId,
    tokenQuantity: holding.tokenQuantity,
    contractAddress: holding.contractAddress,
    name: holding.name,
    symbol: holding.symbol
  };
} 