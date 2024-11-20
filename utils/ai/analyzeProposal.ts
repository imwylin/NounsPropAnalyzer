import type { AIAnalysisResult, ValidationError, ErrorResponse } from '../../types/graphql'

interface AnalyzeResponse {
  result?: AIAnalysisResult & { rawResponse?: string }
  validationWarnings?: ValidationError[]
  error?: string
  details?: ErrorResponse
}

interface ConfidenceMetrics {
  response_confidence: number;
  rubric_scores: {
    classification: number;
    risk_assessment: number;
    modifications: number;
    elements: number;
  };
  grading_response: string;
}

export async function analyzeProposal(description: string, promptVersion: number = 1): Promise<AIAnalysisResult & { 
  rawResponse?: string, 
  validationWarnings?: ValidationError[],
  native_confidence?: ConfidenceMetrics
}> {
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
    console.log('Native confidence metrics:', data.result?.native_confidence)

    if (!response.ok) {
      throw new Error(JSON.stringify({
        error: data.error,
        details: data.details
      }))
    }

    if (data.validationWarnings?.length) {
      console.warn('Analysis validation warnings:', data.validationWarnings)
    }

    const native_confidence = data.result?.native_confidence ? {
      response_confidence: data.result.native_confidence.response_confidence || 0,
      rubric_scores: {
        classification: data.result.native_confidence.rubric_scores?.classification || 0,
        risk_assessment: data.result.native_confidence.rubric_scores?.risk_assessment || 0,
        modifications: data.result.native_confidence.rubric_scores?.modifications || 0,
        elements: data.result.native_confidence.rubric_scores?.elements || 0
      },
      grading_response: data.result.native_confidence.grading_response || ''
    } : undefined

    const result = {
      ...data.result!,
      validationWarnings: data.validationWarnings,
      native_confidence
    }

    console.log('Final result with native confidence:', result)

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