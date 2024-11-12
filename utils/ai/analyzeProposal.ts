import type { AIAnalysisResult } from '../../types/graphql'

export async function analyzeProposal(description: string): Promise<AIAnalysisResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
      signal: controller.signal
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(JSON.stringify({
        error: data.error,
        details: data.details
      }))
    }

    return data
  } finally {
    clearTimeout(timeout)
  }
} 