import { NextApiRequest, NextApiResponse } from 'next';
import { EtherscanAPI } from '@/features/treasury/api/etherscan';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { address, contractAddress } = req.query;

  if (!address || !contractAddress || Array.isArray(address) || Array.isArray(contractAddress)) {
    return res.status(400).json({ message: 'Invalid address or contract address' });
  }

  try {
    const api = new EtherscanAPI();
    const holdings = await api.getNFTHoldings(address, contractAddress);
    
    return res.status(200).json({ holdings });
  } catch (error) {
    console.error('Error fetching NFT holdings:', error);
    return res.status(500).json({ message: 'Error fetching NFT holdings' });
  }
} 