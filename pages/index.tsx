import Link from 'next/link'
import { useProposalCount } from '../hooks/useProposalCount'

/**
 * Landing page for the Nouns 501c3 Analysis system
 */
export default function HomePage() {
  const { data: proposalCount } = useProposalCount()

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Nouns DAO 501c3 Analysis
          </h1>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
            Automated analysis of DAO proposals for charitable compliance
          </p>
          
          <div className="mt-12 space-y-4">
            <Link
              href="/proposals"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              View Proposals ({proposalCount?.toString() || '0'})
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                    Automated Analysis
                  </h3>
                  <p className="mt-5 text-base text-gray-500">
                    AI-powered analysis of proposal compliance with 501c3 requirements
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                    Risk Assessment
                  </h3>
                  <p className="mt-5 text-base text-gray-500">
                    Evaluation of private benefit risk and mission alignment
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                    Export & Share
                  </h3>
                  <p className="mt-5 text-base text-gray-500">
                    Export analysis results in CSV or Excel format
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 