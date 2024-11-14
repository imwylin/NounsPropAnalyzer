import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateMoneyFlow } from '../../utils/treasury';
import styles from './MoneyFlowChart.module.css';
import { Transaction } from '../../utils/types';

interface MoneyFlowChartProps {
  transactions: Transaction[];
}

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function MoneyFlowChart({ transactions }: MoneyFlowChartProps) {
  const flowData = calculateMoneyFlow(transactions.filter(tx => 
    // Include transactions from treasury, token buyer, and USDC payer
    tx.type === 'treasury' || 
    tx.type === 'tokenBuyer' || 
    tx.type === 'usdcPayer'
  ));
  
  // Format data for display
  const chartData = flowData.map(item => ({
    month: monthNames[parseInt(item.month.split('-')[1]) - 1],
    'Inflow (ETH)': parseFloat(item.inflow.toFixed(2)),
    'Outflow (ETH)': parseFloat(item.outflow.toFixed(2)),
    'Net Flow (ETH)': parseFloat(item.netFlow.toFixed(2))
  }));

  // Calculate YTD totals
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
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Inflow (ETH)" fill="#4CAF50" />
            <Bar dataKey="Outflow (ETH)" fill="#f44336" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 