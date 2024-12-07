import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../../lib/db';
import type { SyncStatus } from '../../../../lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SyncStatus | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.query;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Invalid address parameter' });
  }

  try {
    const status = await Database.getSyncStatus(address);
    if (!status) {
      return res.status(200).json({
        contractAddress: address,
        inProgress: false,
        stage: 'idle',
        progress: 0,
        lastSync: null,
        error: null,
        lastSyncedBlock: null
      });
    }

    return res.status(200).json(status);
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 