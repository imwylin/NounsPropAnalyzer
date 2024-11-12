import { useRouter } from 'next/router'
import { useProposal } from '../../../hooks/useSubgraphProposals'
import { formatDistanceToNow } from 'date-fns'

export default function ProposalAnalysis() {
  const router = useRouter()
  const { id } = router.query
  const { data: proposal, isLoading, error } = useProposal(id as string)

  if (isLoading) return <div>Loading proposal...</div>
  if (error) return <div>Error loading proposal</div>
  if (!proposal) return <div>Proposal not found</div>
  const totalVotes = BigInt(proposal.forVotes) + BigInt(proposal.againstVotes) + BigInt(proposal.abstainVotes)
  const forPercentage = totalVotes > 0 ? (Number(BigInt(proposal.forVotes) * BigInt(100)) / Number(totalVotes)).toFixed(2) : '0'
  const againstPercentage = totalVotes > 0 ? (Number(BigInt(proposal.againstVotes) * BigInt(100)) / Number(totalVotes)).toFixed(2) : '0'
  const abstainPercentage = totalVotes > 0 ? (Number(BigInt(proposal.abstainVotes) * BigInt(100)) / Number(totalVotes)).toFixed(2) : '0'

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {proposal.title}
      </h1>
      
      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Status & Timeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-600">Status</p>
              <p className="font-medium">{proposal.status}</p>
            </div>
            <div>
              <p className="text-gray-600">Created</p>
              <p className="font-medium">
                {formatDistanceToNow(new Date(Number(proposal.createdTimestamp) * 1000), { addSuffix: true })}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Start Block</p>
              <p className="font-medium">{proposal.startBlock}</p>
            </div>
            <div>
              <p className="text-gray-600">End Block</p>
              <p className="font-medium">{proposal.endBlock}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Voting Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-600">For</p>
              <p className="font-medium">{forPercentage}% ({proposal.forVotes})</p>
            </div>
            <div>
              <p className="text-gray-600">Against</p>
              <p className="font-medium">{againstPercentage}% ({proposal.againstVotes})</p>
            </div>
            <div>
              <p className="text-gray-600">Abstain</p>
              <p className="font-medium">{abstainPercentage}% ({proposal.abstainVotes})</p>
            </div>
            <div>
              <p className="text-gray-600">Quorum Required</p>
              <p className="font-medium">{proposal.quorumVotes}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded">
            {proposal.description}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Votes</h2>
          <div className="space-y-2">
            {proposal.votes.slice(0, 10).map((vote) => (
              <div key={vote.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span className="font-mono">{vote.voter.slice(0, 6)}...{vote.voter.slice(-4)}</span>
                <span className={vote.support ? 'text-green-600' : 'text-red-600'}>
                  {vote.support ? '✅ For' : '❌ Against'}
                </span>
                <span>{vote.votes} votes</span>
                <span className="text-gray-500 text-sm">
                  {formatDistanceToNow(new Date(Number(vote.timestamp) * 1000), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}