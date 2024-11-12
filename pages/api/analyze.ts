import type { NextApiRequest, NextApiResponse } from 'next'
import { Anthropic } from '@anthropic-ai/sdk'
import type { ParsedAnalysis } from '../../types/parser'
import type { Proposal, ProposalActions } from '../../types/nouns'
import systemPrompt from '../../AIPrompts/systemprompt.json'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

interface AnalyzeRequest {
  proposalId: number
  proposal: Proposal & { actions: ProposalActions }
}

/**
 * API route for analyzing proposals using Claude
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ParsedAnalysis | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { proposalId, proposal } = req.body as AnalyzeRequest

    // Format proposal data for analysis
    const analysisPrompt = `
      You are analyzing Nouns DAO proposals for 501c3 compliance.
      
      Context:
      ${JSON.stringify(systemPrompt.evaluation_context, null, 2)}

      Analyze the following proposal according to these guidelines:
      ${JSON.stringify(systemPrompt.analysis_guidelines, null, 2)}

      Proposal ID: ${proposalId}
      Proposal Details:
      ${JSON.stringify(proposal, null, 2)}

      Provide your analysis in the following format:
      ${JSON.stringify(systemPrompt.output_format, null, 2)}

      ${systemPrompt.disclaimer}
    `.trim()

    // Get analysis from Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: analysisPrompt
      }]
    })

    // Extract analysis from response
    const content = message.content[0].text
    const analysisMatch = content.match(/ANALYSIS:::START([\s\S]*?)ANALYSIS:::END/)
    if (!analysisMatch) {
      throw new Error('Failed to parse analysis response')
    }

    // Parse and validate the analysis JSON
    const analysis: ParsedAnalysis = JSON.parse(analysisMatch[1].trim())

    // Validate required fields from system prompt
    const requiredFields = Object.keys(systemPrompt.output_format.structure.required_fields)
    for (const field of requiredFields) {
      if (!(field in analysis)) {
        throw new Error(`Missing required field in analysis: ${field}`)
      }
    }

    return res.status(200).json(analysis)
  } catch (err) {
    console.error('Analysis failed:', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to analyze proposal'
    })
  }
} 