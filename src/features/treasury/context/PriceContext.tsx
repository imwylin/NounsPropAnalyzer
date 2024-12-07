import { createContext, useContext, useEffect, useState } from 'react';

interface Prices {
  ETH: number;
  WETH: number;
  STETH: number;
  WSTETH: number;
  RETH: number;
}

interface PriceContextType {
  prices: Prices | null;
}

const PriceContext = createContext<PriceContextType>({
  prices: null
});

export function usePrices() {
  return useContext(PriceContext);
}

export function PriceProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<Prices | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPrices() {
      try {
        // Fetch prices from CoinGecko for all tokens
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,staked-ether,wrapped-steth,rocket-pool-eth&vs_currencies=usd'
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch prices: ${response.statusText}`);
        }

        const data = await response.json();

        // Validate the response data
        if (!data.ethereum?.usd) {
          throw new Error('Invalid price data received');
        }

        if (isMounted) {
          const newPrices = {
            ETH: data.ethereum.usd,
            WETH: data.ethereum.usd, // WETH is always 1:1 with ETH
            STETH: data['staked-ether']?.usd || data.ethereum.usd, // Fallback to ETH price
            WSTETH: data['wrapped-steth']?.usd || data.ethereum.usd, // Fallback to ETH price
            RETH: data['rocket-pool-eth']?.usd || data.ethereum.usd // Fallback to ETH price
          };

          // Only update if prices actually changed
          const pricesChanged = !prices || Object.entries(newPrices).some(
            ([key, value]) => prices[key as keyof Prices] !== value
          );

          if (pricesChanged) {
            console.log('Updating prices:', newPrices);
            setPrices(newPrices);
          }
        }
      } catch (err) {
        console.error('Error fetching prices:', err);
        // Keep using last known prices on error
      }
    }

    // Initial fetch
    fetchPrices();

    // Set up interval for updates
    const interval = setInterval(fetchPrices, 60000); // Update every minute

    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [prices]);

  return (
    <PriceContext.Provider value={{ prices }}>
      {children}
    </PriceContext.Provider>
  );
} 