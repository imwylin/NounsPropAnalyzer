import { NextApiRequest, NextApiResponse } from 'next';
import { getMonitoredContracts, ContractConfig } from '../types/contracts';
import { syncContract } from '../lib/sync';
import { Database } from '../../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get monitored contracts
    const contracts = await getMonitoredContracts();
    console.log(`Starting sync for ${contracts.length} contracts`);

    // Update sync status for all contracts
    await Promise.all(
      contracts.map((contract: ContractConfig) =>
        Database.updateSyncStatus(contract.address, { 
          inProgress: true,
          stage: 'queued',
          progress: 0,
          lastSync: new Date(),
          error: null,
          lastSyncedBlock: null
        })
      )
    );

    // Sync each contract
    for (const contract of contracts) {
      try {
        console.log(`Syncing ${contract.address}`);
        await syncContract(contract.address);
      } catch (error) {
        console.error(`Error syncing ${contract.address}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await Database.updateSyncStatus(contract.address, {
          inProgress: false,
          stage: 'error',
          progress: 0,
          lastSync: new Date(),
          error: errorMessage,
          lastSyncedBlock: null
        });
      }
    }

    return res.status(200).json({ message: 'Sync completed' });
  } catch (error) {
    console.error('Error in sync handler:', error);

    // Get contracts again in case they changed during sync
    const contracts = await getMonitoredContracts();

    // Update sync status for all contracts to error
    await Promise.all(
      contracts.map((contract: ContractConfig) =>
        Database.updateSyncStatus(contract.address, {
          inProgress: false,
          stage: 'error',
          progress: 0,
          lastSync: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
          lastSyncedBlock: null
        })
      )
    );

    return res.status(500).json({ error: 'Internal server error' });
  }
} 