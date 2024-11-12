import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { nounsDAOContract } from '../config/wagmi'
import { ParsedAnalysis } from '../types/parser'
import styles from './analyze.module.css'

export default function AnalyzePage() {
  const [proposalId, setProposalId] = useState('')
  const [analyses, setAnalyses] = useState<ParsedAnalysis[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Get proposal description
  const { data: description } = useReadContract({
    ...nounsDAOContract,
    functionName: 'proposalDescriptions',
    args: proposalId ? [BigInt(proposalId)] : undefined,
  }) as { data: string | undefined }

  const handleAnalyze = async () => {
    if (!description || isAnalyzing) return
    setIsAnalyzing(true)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: parseInt(proposalId),
          description: description as string
        })
      })

      if (!response.ok) throw new Error('Analysis failed')
      const analysis: ParsedAnalysis = await response.json()
      
      setAnalyses(prev => [...prev, analysis])
    } catch (err) {
      console.error('Analysis failed:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleExport = () => {
    const headers = [
      'ID',
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

    const rows = analyses.map(a => [
      a.id,
      a.classification,
      a.primary_purpose,
      a.risk_assessment.private_benefit_risk,
      a.risk_assessment.mission_alignment,
      a.risk_assessment.implementation_complexity,
      a.allowable_elements.join('; '),
      a.unallowable_elements.join('; '),
      a.required_modifications.join('; '),
      a.key_considerations.join('; ')
    ])

    const csv = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'proposal-analyses.csv'
    a.click()
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Manual Proposal Analysis</h1>

        <div className={styles.inputSection}>
          <input
            type="number"
            value={proposalId}
            onChange={(e) => setProposalId(e.target.value)}
            placeholder="Enter proposal ID"
            className={styles.input}
          />
          <button
            onClick={handleAnalyze}
            disabled={!description || isAnalyzing}
            className={styles.button}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {description && (
          <div className={styles.preview}>
            <h3>Proposal Description:</h3>
            <p>{description as string}</p>
          </div>
        )}

        {analyses.length > 0 && (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Classification</th>
                    <th>Risk Level</th>
                    <th>Mission Alignment</th>
                    <th>Primary Purpose</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleExport}
              className={styles.exportButton}
            >
              Export to CSV
            </button>
          </>
        )}
      </div>
    </div>
  )
} 