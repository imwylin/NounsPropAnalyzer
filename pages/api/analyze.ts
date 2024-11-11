import type { NextApiRequest, NextApiResponse } from 'next'
import { Anthropic } from '@anthropic-ai/sdk'
import type { ParsedAnalysis } from '../../types/parser'
import type { Proposal, ProposalActions } from '../../types/nouns'

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
      Please analyze this Nouns DAO proposal for 501c3 compliance.
      
      Proposal ID: ${proposalId}
      
      Details:
      ${JSON.stringify(proposal, null, 2)}
      
      Provide a structured analysis following these requirements:
      - Classify the proposal (CHARITABLE/OPERATIONAL/MARKETING/PROGRAM_RELATED/UNALLOWABLE)
      - Identify allowable and unallowable elements
      - Assess risks (private benefit, mission alignment, implementation complexity)
      - Suggest required modifications if needed
      - List key considerations
      
      Format your response as a JSON object between ANALYSIS:::START and ANALYSIS:::END markers.
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

    // Parse the analysis JSON
    const analysis: ParsedAnalysis = JSON.parse(analysisMatch[1].trim())

    return res.status(200).json(analysis)
  } catch (err) {
    console.error('Analysis failed:', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to analyze proposal'
    })
  }
} 