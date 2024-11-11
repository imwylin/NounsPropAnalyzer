import { useRouter } from 'next/router'
import { ProposalAnalysisDashboard } from '../../../components/analysis/ProposalAnalysisDashboard'
import styles from '../proposals.module.css'

/**
 * Page for viewing detailed analysis of a single proposal
 */
export default function ProposalAnalysisPage() {
  const router = useRouter()
  const { id } = router.query

  // Handle invalid ID
  if (!id || Array.isArray(id)) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.error}>Invalid proposal ID</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <ProposalAnalysisDashboard proposalId={parseInt(id)} />
      </div>
    </div>
  )
} 