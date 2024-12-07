import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../../lib/db/index';
import { getContractByAddress } from '../../../../features/treasury/types/contracts';
import type { SyncStatus } from '../../../../lib/types';
import { syncContract } from '../../../../features/treasury/lib/sync';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SyncStatus | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  const contract = getContractByAddress(address);
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  try {
    // Get both contract and sync status
    const [contractData, status] = await Promise.all([
      Database.getContract(address),
      Database.getSyncStatus(address)
    ]);

    // Initialize contract if it doesn't exist
    if (!contractData) {
      const initialData = {
        address,
        name: contract.name,
        type: contract.type,
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
      };
      await Database.updateContract(address, initialData);
    }

    // Initialize or get sync status
    const currentStatus = status || await Database.getSyncStatus(address);
    if (!currentStatus) {
      return res.status(500).json({ error: 'Failed to get sync status' });
    }

    // If sync is already in progress, return current status
    if (currentStatus.inProgress) {
      return res.status(200).json(currentStatus);
    }

    // Update sync status to in progress
    const updatedStatus = {
      contractAddress: address,
      inProgress: true,
      stage: 'initializing',
      progress: 0,
      lastSync: new Date(),
      error: null,
      lastSyncedBlock: currentStatus.lastSyncedBlock
    };
    
    await Database.updateSyncStatus(address, updatedStatus);

    // Start sync process in background
    syncContract(address).catch(async (error) => {
      console.error('Error during sync:', error);
      await Database.updateSyncStatus(address, {
        ...updatedStatus,
        inProgress: false,
        stage: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });

    return res.status(200).json(updatedStatus);
  } catch (error) {
    console.error('Error starting sync:', error);
    
    // Update sync status with error
    const errorStatus = {
      inProgress: false,
      stage: 'error',
      progress: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastSync: new Date()
    };
    
    await Database.updateSyncStatus(address, errorStatus);

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
} 