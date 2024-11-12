import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { nounsDAOContract } from '../config/wagmi'
import { ParsedAnalysis } from '../types/parser'
import { Proposal, ProposalActions } from '../config/NounsDAOProxy'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import styles from './analyze.module.css'

export default function AnalyzePage() {
  const [proposalId, setProposalId] = useState('')
  const [analyses, setAnalyses] = useState<ParsedAnalysis[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')

  // Get proposal data
  const { data: proposal, isLoading: isLoadingProposal } = useReadContract({
    ...nounsDAOContract,
    functionName: 'proposals',
    args: proposalId ? [BigInt(proposalId)] : undefined,
  }) as { data: Proposal | undefined, isLoading: boolean }

  // Get proposal actions with proper typing
  const { data: actions, isLoading: isLoadingActions } = useReadContract({
    ...nounsDAOContract,
    functionName: 'getActions',
    args: proposalId ? [BigInt(proposalId)] : undefined,
  }) as { data: ProposalActions | undefined, isLoading: boolean }

  // Get proposal description
  const { data: description, isLoading: isLoadingDescription } = useReadContract({
    ...nounsDAOContract,
    functionName: 'proposalDescriptions',
    args: proposalId ? [BigInt(proposalId)] : undefined,
  }) as { data: string | undefined, isLoading: boolean }

  const handleAnalyze = async () => {
    if (!proposal || !description || isAnalyzing) return
    setError('')
    setIsAnalyzing(true)

    try {
      const existingAnalysis = analyses.find(a => a.id === proposalId)
      if (existingAnalysis) {
        setError('This proposal has already been analyzed')
        return
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: parseInt(proposalId),
          description: description,
          actions: actions
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Analysis failed')
      }
      
      const analysis: ParsedAnalysis = await response.json()
      setAnalyses(prev => [...prev, analysis])
    } catch (err) {
      console.error('Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleExport = () => {
    // Define CSV headers based on the ParsedAnalysis type
    const headers = [
      'Proposal ID',
      'Classification',
      'Primary Purpose',
      'Risk Level',
      'Mission Alignment',
      'Implementation Complexity',
      'Allowable Elements',
      'Unallowable Elements',
      'Required Modifications',
      'Key Considerations'
    ]

    // Convert analyses to CSV rows
    const rows = analyses.map(a => [
      a.id,
      a.classification,
      a.primary_purpose,
      a.risk_assessment.private_benefit_risk,
      a.risk_assessment.mission_alignment,
      a.risk_assessment.implementation_complexity,
      a.allowable_elements.join('|'),
      a.unallowable_elements.join('|'),
      a.required_modifications.join('|'),
      a.key_considerations.join('|')
    ])

    // Create and download CSV
    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `nouns-proposal-analyses-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isLoading = isLoadingProposal || isLoadingActions || isLoadingDescription

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Proposal Analysis Dashboard</h1>

        <div className={styles.inputSection}>
          <input
            type="number"
            value={proposalId}
            onChange={(e) => {
              setError('')
              setProposalId(e.target.value)
            }}
            placeholder="Enter proposal ID"
            className={styles.input}
            min="0"
          />
          <button
            onClick={handleAnalyze}
            disabled={!proposal || !description || isAnalyzing || isLoading}
            className={styles.button}
          >
            {isAnalyzing ? 'Analyzing...' : isLoading ? 'Loading...' : 'Analyze'}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {proposal && description && (
          <div className={styles.preview}>
            <h3>Proposal {proposalId}</h3>
            <div className={styles.proposalDetails}>
              <p><strong>Proposer:</strong> {proposal.proposer}</p>
              <p><strong>Status:</strong> {proposal.executed ? 'Executed' : proposal.canceled ? 'Canceled' : 'Active'}</p>
              <p><strong>Votes:</strong> For: {proposal.forVotes.toString()}, Against: {proposal.againstVotes.toString()}</p>
              <div className={styles.description}>
                <h4>Description:</h4>
                <ReactMarkdown 
                  remarkPlugins={[remarkBreaks]}
                  className={styles.markdown}
                >
                  {description}
                </ReactMarkdown>
              </div>
              {actions && (
                <div className={styles.transactions}>
                  <h4>Proposed Transactions:</h4>
                  {actions.targets.map((target: string, i: number) => (
                    <div key={i} className={styles.transaction}>
                      <p>Target: {target}</p>
                      <p>Value: {actions.values[i].toString()} ETH</p>
                      <p>Signature: {actions.signatures[i]}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {analyses.length > 0 && (
          <>
            <div className={styles.analysisHeader}>
              <h3>Analysis Results ({analyses.length})</h3>
              <button
                onClick={handleExport}
                className={styles.exportButton}
              >
                Export to CSV
              </button>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Classification</th>
                    <th>Risk Level</th>
                    <th>Mission Alignment</th>
                    <th>Primary Purpose</th>
                    <th>Required Modifications</th>
                  </tr>
                </thead>
                <tbody>
                  {analyses.map(analysis => (
                    <tr key={analysis.id}>
                      <td>{analysis.id}</td>
                      <td>{analysis.classification}</td>
                      <td>{analysis.risk_assessment.private_benefit_risk}</td>
                      <td>{analysis.risk_assessment.mission_alignment}</td>
                      <td>{analysis.primary_purpose}</td>
                      <td>{analysis.required_modifications.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 