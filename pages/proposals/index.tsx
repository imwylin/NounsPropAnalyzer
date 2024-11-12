import Link from 'next/link'

/**
 * Main page for viewing and managing proposal analyses
 */
export default function ProposalsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Nouns Proposals</h1>
      <Link 
        href="/analyze"
        className="text-blue-600 hover:underline"
      >
        Go to Proposal Analyzer →
      </Link>
    </div>
  )
}
