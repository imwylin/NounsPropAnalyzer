import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './treasury.module.css';
import { MoneyFlowChart } from '../components/treasury/MoneyFlowChart';

interface TokenBalance {
  token_address: string;
  symbol: string;
  name: string;
  logo: string | null;
  decimals: number;
  balance: string;
  balance_formatted: string;
  usd_price: number | null;
  usd_value: number | null;
  possible_spam: boolean;
  verified_contract: boolean;
  native_token: boolean;
}

interface Transaction {
  hash: string;
  from_address: string;
  to_address: string;
  block_timestamp: string;
  value: string;
  type: 'auction' | 'treasury' | 'tokenBuyer' | 'usdcPayer';
  category: string;
  description: string;
  native_transfers?: {
    from_address: string;
    to_address: string;
    value: string;
    value_formatted: string;
  }[];
  isAuctionSettlement: boolean;
  contractDetails: string;
  direction: string;
}

// Constants for addresses
// const TREASURY_ADDRESS = '0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71';
const AUCTION_HOUSE_ADDRESS = '0x830BD73E4184ceF73443C15111a1DF14e495C706';

// Update the feedsContainer style
// const feedsContainer = { ... }

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

interface FeedRowProps {
  title: string;
  transactions: Transaction[];
  balance?: React.ReactNode;
  name: string;
  feedLoading: {[key: string]: boolean};
  feedErrors: {[key: string]: string};
}

const FeedRow = ({ title, transactions, balance, name, feedLoading, feedErrors }: FeedRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOnlyWins, setShowOnlyWins] = useState(false);

  // Filter transactions if showing only wins
  const displayedTransactions = title === "Auction Activity" && showOnlyWins
    ? transactions.filter(tx => 
        tx.category === 'NFT Transfer' && 
        tx.from_address.toLowerCase() === AUCTION_HOUSE_ADDRESS.toLowerCase()
      )
    : transactions;

  return (
    <div className={styles.feedRow}>
      <div 
        className={styles.feedHeader} 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
            ▶
          </span>
          <h2 className={styles.feedTitle}>{title}</h2>
        </div>
        {title === "Auction Activity" && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowOnlyWins(!showOnlyWins);
            }}
            className={styles.filterButton}
          >
            {showOnlyWins ? 'Show All Activity' : 'Show Only Wins'}
          </button>
        )}
      </div>
      <div className={`${styles.feedContent} ${isExpanded ? styles.expanded : ''}`}>
        {feedLoading[name] ? (
          <div className={styles.loading}>Loading...</div>
        ) : feedErrors[name] ? (
          <div className={styles.error}>{feedErrors[name]}</div>
        ) : (
          <>
            {balance}
            <div className={styles.feed}>
              <div className={styles.transactionList}>
                {displayedTransactions.map((tx) => (
                  <div key={tx.hash} className={styles.transactionCard}>
                    {tx.category === 'Auction Bid' ? (
                      // Auction Bid layout
                      <>
                        <h3 className={styles.transactionTitle}>{tx.description}</h3>
                        <p className={styles.transactionText}>
                          Time: {new Date(tx.block_timestamp).toLocaleString()}
                        </p>
                        <p className={styles.transactionText}>
                          From: <span className={styles.address}>{formatAddress(tx.from_address)}</span>
                        </p>
                        <p className={styles.transactionText}>
                          <a 
                            href={`https://etherscan.io/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.txLink}
                          >
                            View on Etherscan ↗
                          </a>
                        </p>
                      </>
                    ) : tx.category === 'NFT Transfer' && tx.from_address.toLowerCase() === AUCTION_HOUSE_ADDRESS.toLowerCase() ? (
                      // NFT Transfer FROM auction house layout (Auction Win)
                      <div className={styles.auctionWin}>
                        <h3 className={styles.transactionTitle}>{tx.description}</h3>
                        <p className={styles.transactionText}>Category: Auction Win</p>
                        <p className={styles.transactionText}>
                          From: <span className={styles.address}>{formatAddress(tx.from_address)}</span>
                        </p>
                        <p className={styles.transactionText}>
                          To: <span className={styles.address}>{formatAddress(tx.to_address)}</span>
                        </p>
                        <p className={styles.transactionText}>
                          Time: {new Date(tx.block_timestamp).toLocaleString()}
                        </p>
                        <p className={styles.transactionText}>
                          <a 
                            href={`https://etherscan.io/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.txLink}
                          >
                            View on Etherscan ↗
                          </a>
                        </p>
                      </div>
                    ) : (
                      // Regular transaction layout
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                          {tx.direction && (
                            <span className={`${styles.direction} ${
                              tx.direction === 'Outbound' ? styles.outbound : styles.inbound
                            }`}>
                              {tx.direction}
                            </span>
                          )}
                          <h3 className={styles.transactionTitle}>{tx.description}</h3>
                        </div>
                        <p className={styles.transactionText}>Category: {tx.category}</p>
                        {tx.contractDetails && tx.contractDetails !== 'Unknown Contract' && (
                          <p className={styles.transactionText}>Contract: {tx.contractDetails}</p>
                        )}
                        <p className={styles.transactionText}>
                          From: <span className={styles.address}>{formatAddress(tx.from_address)}</span>
                        </p>
                        <p className={styles.transactionText}>
                          To: <span className={styles.address}>{formatAddress(tx.to_address)}</span>
                        </p>
                        <p className={styles.transactionText}>
                          Time: {new Date(tx.block_timestamp).toLocaleString()}
                        </p>
                        <p className={styles.transactionText}>
                          <a 
                            href={`https://etherscan.io/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.txLink}
                          >
                            View on Etherscan ↗
                          </a>
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function Treasury() {
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [tokenBuyerBalances, setTokenBuyerBalances] = useState<TokenBalance[]>([]);
  const [usdcPayerBalances, setUsdcPayerBalances] = useState<TokenBalance[]>([]);
  const [feedErrors, setFeedErrors] = useState<{[key: string]: string}>({});
  const [feedLoading, setFeedLoading] = useState<{[key: string]: boolean}>({
    dao: true,
    auction: true,
    tokenBuyer: true,
    usdcPayer: true
  });

  const totalUsdValue = tokenBalances.reduce((sum, token) => {
    return sum + (token.usd_value || 0);
  }, 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch each feed separately to handle individual errors
        const fetchFeed = async (endpoint: string, name: string) => {
          try {
            const response = await fetch(`/api/treasury/${endpoint}`);
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.error || 'Failed to fetch data');
            
            setFeedLoading(prev => ({ ...prev, [name]: false }));
            return data;
          } catch (error) {
            console.error(`${name} feed error:`, error);
            setFeedErrors(prev => ({ 
              ...prev, 
              [name]: error instanceof Error ? error.message : 'Failed to fetch data'
            }));
            setFeedLoading(prev => ({ ...prev, [name]: false }));
            return null;
          }
        };

        const [daoData, auctionData, tokenBuyerData, usdcPayerData] = await Promise.all([
          fetchFeed('dao', 'dao'),
          fetchFeed('auction-house', 'auction'),
          fetchFeed('token-buyer', 'tokenBuyer'),
          fetchFeed('usdc-payer', 'usdcPayer')
        ]);

        // Set balances if available
        if (daoData) setTokenBalances(daoData.balances);
        if (tokenBuyerData) setTokenBuyerBalances(tokenBuyerData.balances);
        if (usdcPayerData) setUsdcPayerBalances(usdcPayerData.balances);
        
        // Combine all successful transactions
        const allTransactions = [
          ...(daoData?.transactions || []),
          ...(auctionData?.transactions || []),
          ...(tokenBuyerData?.transactions || []),
          ...(usdcPayerData?.transactions || [])
        ].sort((a, b) => 
          new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime()
        );

        setTransactions(allTransactions);
        setIsLoading(false);
      } catch (e) {
        console.error('Global error:', e);
        setError('Failed to fetch treasury data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatBalance = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Update the auction transactions filtering
  const auctionTransactions = transactions.filter(tx => {
    const isAuctionTx = tx.type === 'auction' || 
      (tx.category === 'NFT Transfer' && (
        tx.from_address.toLowerCase() === AUCTION_HOUSE_ADDRESS.toLowerCase() ||
        tx.to_address.toLowerCase() === AUCTION_HOUSE_ADDRESS.toLowerCase()
      ));
    
    return isAuctionTx;
  });

  const treasuryTransactions = transactions.filter(tx => 
    tx.type === 'treasury' && 
    tx.category !== 'NFT Transfer' &&
    !tx.isAuctionSettlement
  );

  const tokenBuyerTransactions = transactions.filter(tx => 
    tx.type === 'tokenBuyer'
  );

  const usdcPayerTransactions = transactions.filter(tx => 
    tx.type === 'usdcPayer'
  );

  // Sort tokens by USD value and split into top and other
  const sortedTokens = [...tokenBalances].sort((a, b) => 
    (b.usd_value || 0) - (a.usd_value || 0)
  );
  const topTokens = sortedTokens.slice(0, 8);
  const otherTokens = sortedTokens.slice(8);

  // Add balance display component
  const ContractBalance = ({ title, balances }: { title: string, balances: TokenBalance[] }) => {
    const totalValue = balances.reduce((sum, token) => sum + (token.usd_value || 0), 0);
    
    return (
      <div className={styles.contractBalance}>
        <h3>{title} Balance</h3>
        <p>${formatBalance(totalValue)}</p>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <>
          <h1 className={styles.pageTitle}>Nouns DAO Treasury Analysis</h1>
          
          <MoneyFlowChart transactions={treasuryTransactions} />
          
          <section className={styles.balances}>
            <h2 className={styles.sectionTitle}>Token Balances</h2>
            <div className={styles.totalBalance}>
              Total Value: ${totalUsdValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} USD
            </div>
            <div className={styles.balanceGrid}>
              {/* Top 8 tokens */}
              {topTokens.map((token) => (
                <div key={token.token_address} className={styles.balanceCard}>
                  <div className={styles.tokenHeader}>
                    {token.logo && (
                      <div className={styles.tokenLogoWrapper}>
                        <Image 
                          src={token.logo} 
                          alt={token.symbol}
                          width={24}
                          height={24}
                          className={styles.tokenLogo}
                          unoptimized
                        />
                      </div>
                    )}
                    <h3>{token.name} ({token.symbol})</h3>
                  </div>
                  <p>Balance: {formatBalance(token.balance_formatted)}</p>
                  {token.usd_value && (
                    <p>Value: ${formatBalance(token.usd_value)}</p>
                  )}
                  {token.native_token && token.symbol !== 'ETH' && (
                    <span className={styles.nativeToken}>Native Token</span>
                  )}
                </div>
              ))}
            </div>

            {/* Other tokens in collapsible section */}
            {otherTokens.length > 0 && (
              <div className={styles.otherTokens}>
                <button 
                  onClick={() => setShowAllTokens(!showAllTokens)}
                  className={styles.toggleButton}
                >
                  {showAllTokens ? '▼' : '▶'} Other ({otherTokens.length} tokens)
                </button>
                
                {showAllTokens && (
                  <div className={styles.balanceGrid}>
                    {otherTokens.map((token) => (
                      <div key={token.token_address} className={styles.balanceCard}>
                        <div className={styles.tokenHeader}>
                          {token.logo && (
                            <div className={styles.tokenLogoWrapper}>
                              <Image 
                                src={token.logo} 
                                alt={token.symbol}
                                width={24}
                                height={24}
                                className={styles.tokenLogo}
                                unoptimized
                              />
                            </div>
                          )}
                          <h3>{token.name} ({token.symbol})</h3>
                        </div>
                        <p>Balance: {formatBalance(token.balance_formatted)}</p>
                        {token.usd_value && (
                          <p>Value: ${formatBalance(token.usd_value)}</p>
                        )}
                        {token.native_token && token.symbol !== 'ETH' && (
                          <span className={styles.nativeToken}>Native Token</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className={styles.feedsContainer}>
            <FeedRow 
              title="Auction Activity" 
              transactions={auctionTransactions} 
              name="auction"
              feedLoading={feedLoading}
              feedErrors={feedErrors}
            />
            <FeedRow 
              title="Treasury" 
              transactions={treasuryTransactions} 
              name="treasury"
              feedLoading={feedLoading}
              feedErrors={feedErrors}
            />
            <FeedRow 
              title="Token Buyer" 
              transactions={tokenBuyerTransactions}
              balance={<ContractBalance title="Token Buyer" balances={tokenBuyerBalances} />}
              name="tokenBuyer"
              feedLoading={feedLoading}
              feedErrors={feedErrors}
            />
            <FeedRow 
              title="USDC Payer" 
              transactions={usdcPayerTransactions}
              balance={<ContractBalance title="USDC Payer" balances={usdcPayerBalances} />}
              name="usdcPayer"
              feedLoading={feedLoading}
              feedErrors={feedErrors}
            />
          </section>
        </>
      )}
    </div>
  );
} 