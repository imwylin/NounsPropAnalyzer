import Link from 'next/link'

/**
 * Main page for viewing and managing proposal analyses
 */
export default function ProposalsPage() {
  return (
    <div className="container mx-auto p-4 dark:bg-[#1a1a1a] dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-6">Nouns Proposals</h1>
      <Link 
        href="/analyze"
        className="text-blue-600 hover:underline dark:text-blue-400"
      >
        Go to Proposal Analyzer →
      </Link>
    </div>
  )
}
