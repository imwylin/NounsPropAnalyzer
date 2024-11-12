import { useProposals } from '../../hooks/useSubgraphProposals'
import Link from 'next/link'

/**
 * Main page for viewing and managing proposal analyses
 */
export default function ProposalsPage() {
  const { data: proposals, isLoading, error } = useProposals()

  if (isLoading) return <div>Loading proposals...</div>
  if (error) return <div>Error loading proposals</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Nouns Proposals</h1>
      <div className="space-y-4">
        {proposals?.map((proposal) => (
          <div key={proposal.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold">Proposal {proposal.id}</h2>
              <span className="px-2 py-1 rounded text-sm bg-gray-100">
                {proposal.status}
              </span>
            </div>
            <p className="mt-2 text-gray-700">
              {proposal.description.split('\n')[0]} {/* Show first line of description */}
            </p>
            <Link 
              href={`/proposals/${proposal.id}/analysis`}
              className="mt-2 text-blue-600 hover:underline"
            >
              View Analysis →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
