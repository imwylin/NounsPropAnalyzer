import { NextApiRequest, NextApiResponse } from 'next';
import { initializeDatabase } from '../../../lib/db/init';
import { initializeContracts } from '../../../features/treasury/types/contracts';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // First initialize database schema
    await initializeDatabase();
    
    // Then initialize contracts
    await initializeContracts();
    
    res.status(200).json({ message: 'Database and contracts initialized successfully' });
  } catch (error) {
    console.error('Error initializing:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 