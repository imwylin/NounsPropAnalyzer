import { useState, useEffect } from 'react';

interface Prices {
  ETH: number;
  NOUNS: number;
}

export function usePrices() {
  const [prices, setPrices] = useState<Prices>({
    ETH: 0,
    NOUNS: 0
  });

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Fetch ETH price from Coingecko
        const ethResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const ethData = await ethResponse.json();
        const ethPrice = ethData.ethereum.usd;

        // For now, set NOUNS price to a fixed value (you can update this with real data later)
        const nounsPrice = 30; // ETH

        setPrices({
          ETH: ethPrice,
          NOUNS: nounsPrice * ethPrice // Convert to USD
        });
      } catch (error) {
        console.error('Failed to fetch prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return { prices };
} 