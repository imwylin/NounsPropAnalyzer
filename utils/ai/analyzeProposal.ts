import type { AIAnalysisResult } from '../../types/graphql'

export async function analyzeProposal(description: string): Promise<AIAnalysisResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000) // Increased to 60 seconds

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
      signal: controller.signal
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(JSON.stringify({
        error: data.error,
        details: data.details
      }))
    }

    const data = await response.json()
    return data
  } finally {
    clearTimeout(timeout)
  }
} 