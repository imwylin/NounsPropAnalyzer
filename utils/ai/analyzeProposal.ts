import type { AIAnalysisResult } from '../../types/graphql'

export async function analyzeProposal(description: string, promptVersion: number = 1): Promise<AIAnalysisResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120000) // Increased to 120 seconds

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description, promptVersion }),
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
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out after 120 seconds')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
} 