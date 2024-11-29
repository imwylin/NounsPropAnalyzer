import { NextApiRequest, NextApiResponse } from 'next';
import { get } from '@vercel/edge-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // List all keys
    const keys = await get('*');
    
    // Get specific data
    const treasuryKeys = Object.keys(keys as object).filter(k => k.startsWith('treasury:'));
    const auctionKeys = Object.keys(keys as object).filter(k => k.startsWith('auction:'));

    const data = {
      treasuryKeys,
      auctionKeys,
      // Get first item of each type as sample
      treasurySample: treasuryKeys.length > 0 ? await get(treasuryKeys[0]) : null,
      auctionSample: auctionKeys.length > 0 ? await get(auctionKeys[0]) : null,
    };

    res.status(200).json(data);
  } catch (error) {
    console.error('Failed to check cache:', error);
    res.status(500).json({ error: 'Failed to check cache' });
  }
} 