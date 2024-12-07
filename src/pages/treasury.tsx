import dynamic from 'next/dynamic'
import type { NextPage } from 'next'
import Layout from '../core/components/Layout'
import { ContractDataProvider } from '../features/treasury/context/ContractDataContext'
import { SelectedContractProvider } from '../features/treasury/context/SelectedContractContext'
import { useContractData } from '../features/treasury/context/ContractDataContext'
import styles from './treasury.module.css'

// Dynamic imports with loading states
const TreasuryOverview = dynamic(
  () => import('../features/treasury/components/TreasuryOverview').then(mod => mod.default),
  { 
    loading: () => <div className="animate-pulse h-48 bg-gray-100 dark:bg-gray-800 rounded-lg" />,
    ssr: false
  }
)

const ContractTabs = dynamic(
  () => import('../features/treasury/components/ContractTabs').then(mod => mod.ContractTabs),
  {
    loading: () => <div className="animate-pulse h-12 bg-gray-100 dark:bg-gray-800 rounded-lg mt-6" />,
    ssr: false
  }
)

const ContractDashboard = dynamic(
  () => import('../features/treasury/components/ContractDashboard').then(mod => mod.default),
  {
    loading: () => <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800 rounded-lg mt-6" />,
    ssr: false
  }
)

function TreasuryContent() {
  const { state } = useContractData();
  const { contracts, isLoading } = state;

  return (
    <div className="container mx-auto">
      <div className="px-4 py-8">
        <TreasuryOverview contracts={contracts} isLoading={isLoading} />
      </div>
      <div className={styles.contractContainer}>
        <ContractTabs />
        <ContractDashboard />
      </div>
    </div>
  );
}

const Treasury: NextPage = () => {
  return (
    <Layout>
      <ContractDataProvider>
        <SelectedContractProvider>
          <TreasuryContent />
        </SelectedContractProvider>
      </ContractDataProvider>
    </Layout>
  )
}

export default Treasury