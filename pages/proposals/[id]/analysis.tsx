import { useRouter } from 'next/router'
import { ProposalAnalysisDashboard } from '../../../components/analysis/ProposalAnalysisDashboard'

/**
 * Page for viewing detailed analysis of a single proposal
 */
export default function ProposalAnalysisPage() {
  const router = useRouter()
  const { id } = router.query

  // Handle invalid ID
  if (!id || Array.isArray(id)) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <p className="text-red-500">Invalid proposal ID</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <ProposalAnalysisDashboard proposalId={parseInt(id)} />
      </div>
    </div>
  )
} 