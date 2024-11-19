import type { AIAnalysisResult, ValidationError, ErrorResponse } from '../../types/graphql'

interface AnalyzeResponse {
  result?: AIAnalysisResult & { rawResponse?: string }
  validationWarnings?: ValidationError[]
  error?: string
  details?: ErrorResponse
}

export async function analyzeProposal(description: string, promptVersion: number = 1): Promise<AIAnalysisResult & { rawResponse?: string, validationWarnings?: ValidationError[] }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120000)

  try {
    console.log('Making API request with prompt version:', promptVersion)

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description, promptVersion }),
      signal: controller.signal
    })

    const data: AnalyzeResponse = await response.json()
    console.log('Raw API Response:', data)
    console.log('Risk Assessment in response:', data.result?.risk_assessment)
    console.log('Mission Alignment value:', data.result?.risk_assessment.mission_alignment)

    if (!response.ok) {
      throw new Error(JSON.stringify({
        error: data.error,
        details: data.details
      }))
    }

    if (data.validationWarnings?.length) {
      console.warn('Analysis validation warnings:', data.validationWarnings)
    }

    const result = {
      ...data.result!,
      validationWarnings: data.validationWarnings
    }

    console.log('Processed result:', result)
    console.log('Final risk assessment:', result.risk_assessment)
    console.log('Final mission alignment:', result.risk_assessment.mission_alignment)

    return result
  } catch (error) {
    console.error('Analysis error:', error)
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out after 120 seconds')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
} 