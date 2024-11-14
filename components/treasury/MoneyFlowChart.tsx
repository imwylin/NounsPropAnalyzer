import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateMoneyFlow } from '../../utils/treasury';
import styles from './MoneyFlowChart.module.css';
import { Transaction } from '../../utils/types';
import { useEffect, useState } from 'react';

interface MoneyFlowChartProps {
  transactions: Transaction[];
}

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function MoneyFlowChart({ transactions }: MoneyFlowChartProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const flowData = calculateMoneyFlow(transactions.filter(tx => 
    tx.type === 'treasury' || 
    tx.type === 'tokenBuyer' || 
    tx.type === 'usdcPayer'
  ));
  
  const chartData = flowData.map(item => ({
    month: monthNames[parseInt(item.month.split('-')[1]) - 1],
    'Inflow (ETH)': parseFloat(item.inflow.toFixed(2)),
    'Outflow (ETH)': parseFloat(item.outflow.toFixed(2)),
    'Net Flow (ETH)': parseFloat(item.netFlow.toFixed(2))
  }));

  const ytdTotals = flowData.reduce((acc, item) => ({
    inflow: acc.inflow + item.inflow,
    outflow: acc.outflow + item.outflow,
    netFlow: acc.netFlow + item.netFlow
  }), { inflow: 0, outflow: 0, netFlow: 0 });

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Treasury Flow YTD</h2>
      <div className={styles.totals}>
        <div className={styles.total}>
          <span>Total Inflow:</span>
          <span className={styles.inflow}>{ytdTotals.inflow.toFixed(2)} ETH</span>
        </div>
        <div className={styles.total}>
          <span>Total Outflow:</span>
          <span className={styles.outflow}>{ytdTotals.outflow.toFixed(2)} ETH</span>
        </div>
        <div className={styles.total}>
          <span>Net Flow:</span>
          <span className={ytdTotals.netFlow >= 0 ? styles.inflow : styles.outflow}>
            {ytdTotals.netFlow.toFixed(2)} ETH
          </span>
        </div>
      </div>
      <div className={styles.chart}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDarkMode ? '#5c5a5a' : '#e5e7eb'}
            />
            <XAxis 
              dataKey="month" 
              stroke={isDarkMode ? '#9ca3af' : '#4b5563'}
            />
            <YAxis 
              stroke={isDarkMode ? '#9ca3af' : '#4b5563'}
            />
            <Tooltip 
              contentStyle={{
                background: isDarkMode ? '#4b4949' : '#ffffff',
                border: `1px solid ${isDarkMode ? '#5c5a5a' : '#e5e7eb'}`,
                borderRadius: '4px',
                padding: '8px'
              }}
              labelStyle={{
                color: isDarkMode ? '#e5e7eb' : '#111827',
                marginBottom: '4px'
              }}
            />
            <Legend />
            <Bar dataKey="Inflow (ETH)" fill="#687f7c" />
            <Bar dataKey="Outflow (ETH)" fill="#8d6263" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 