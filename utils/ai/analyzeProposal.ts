import type { AIAnalysisResult } from '../../types/graphql'

export async function analyzeProposal(description: string): Promise<AIAnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Analysis failed')
  }

  return response.json()
} 