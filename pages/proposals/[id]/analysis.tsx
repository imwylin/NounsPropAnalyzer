import { useRouter } from 'next/router'

export default function ProposalAnalysis() {
  const router = useRouter()
  
  // Redirect to the analyze page with the ID
  if (typeof window !== 'undefined' && router.query.id) {
    router.push(`/analyze?id=${router.query.id}`)
  }

  return <div>Redirecting...</div>
}