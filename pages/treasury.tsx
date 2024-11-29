import { useTreasury } from '../hooks/useTreasury';
import { useAuctionData } from '../hooks/useAuctionData';
import { TreasuryFeed } from '../components/TreasuryFeed';
import { AuctionHouseFeed } from '../components/AuctionHouseFeed';
import styles from './treasury.module.css';
import { EnhancedTransaction } from '../utils/types';
import { useTreasuryData } from '../hooks/useTreasuryData';

export default function Treasury() {
  const { 
    rawData,
    refreshData, 
    isLoading 
  } = useTreasury('all', {
    contractTypes: ['treasury', 'token_buyer', 'payer']
  });

  const treasuryData = useTreasuryData(rawData);
  const auctionData = useAuctionData();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Treasury Operations</h1>
          <div className={styles.subtitle}>Financial Activity Dashboard</div>
        </div>

        <div className={styles.controls}>
          <button 
            onClick={refreshData}
            className={styles.refreshButton}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.dashboardGrid}>
          {/* Treasury Operations Section */}
          <section className={styles.treasurySection}>
            <div className={styles.sectionHeader}>
              <h2>Treasury Activity</h2>
            </div>

            <div className={styles.transactionsFeed}>
              <table className={styles.transactionsTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Contract</th>
                    <th>Type</th>
                    <th className={styles.rightAlign}>Amount</th>
                    <th>Direction</th>
                    <th>Counterparty</th>
                    <th className={styles.centerAlign}>Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {[...treasuryData.ethTransactions, ...treasuryData.usdcTransactions]
                    .sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp))
                    .map((tx: EnhancedTransaction) => {
                      const uniqueKey = `${tx.hash}-${tx.timeStamp}-${tx.tokenSymbol || 'ETH'}-${tx.value}`;
                      return (
                        <TreasuryFeed 
                          key={uniqueKey}
                          transaction={tx}
                          contractName={tx.contractName}
                        />
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Auction House Section */}
          <section className={styles.auctionSection}>
            <AuctionHouseFeed 
              transactions={auctionData.nounTransactions}
              balances={auctionData.balances}
            />
          </section>
        </div>
      </main>
    </div>
  );
}