import { NextApiRequest, NextApiResponse } from 'next';
import { startBackgroundSync } from '../../../../features/treasury/lib/sync';

// Simple lock mechanism
let isSyncing = false;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if sync is already running
  if (isSyncing) {
    console.log('Sync already in progress, skipping new request');
    return res.status(200).json({ 
      message: 'Sync already in progress',
      timestamp: new Date().toISOString()
    });
  }

  try {
    console.log('Scheduler endpoint called - starting background sync process');
    isSyncing = true;
    
    // Start background sync process
    startBackgroundSync()
      .then(() => {
        console.log('Background sync completed successfully');
        isSyncing = false;
      })
      .catch(error => {
        console.error('Background sync failed:', error);
        isSyncing = false;
      });
    
    console.log('Background sync process initiated');
    return res.status(200).json({ 
      message: 'Background sync started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in scheduler endpoint:', error);
    isSyncing = false;
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
} 