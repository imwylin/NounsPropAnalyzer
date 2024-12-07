import { NextApiRequest, NextApiResponse } from 'next';
import { Database } from '../../../../lib/db/index';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear sync locks by setting in_progress to false for all contracts
    await Database.clearAllSyncLocks();
    return res.status(200).json({ message: 'Sync locks cleared' });
  } catch (error) {
    console.error('Error clearing sync locks:', error);
    return res.status(500).json({ error: 'Failed to clear sync locks' });
  }
} 