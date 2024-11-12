import { useState } from 'react'
import { useProposalDescription } from '../hooks/useSubgraphProposals'
import styles from './analyze.module.css'
import { analyzeProposal } from '../utils/ai/analyzeProposal'

interface AnalysisResult {
  proposalId: string
  timestamp: string
  is501c3Compliant: boolean
  category: string
  riskLevel: 'Low' | 'Medium' | 'High'
  reasoning: string
  recommendations: string
}

export default function AnalyzePage() {
  const [proposalId, setProposalId] = useState('')
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  
  const { 
    data: description,
    isLoading,
    refetch: fetchDescription,
    error 
  } = useProposalDescription(proposalId)

  const handleFetchDescription = async () => {
    if (!proposalId.trim()) return
    await fetchDescription()
  }

  const handleAnalyze = async () => {
    if (!description) return
    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      const aiResult = await analyzeProposal(description)
      
      const result: AnalysisResult = {
        proposalId,
        timestamp: new Date().toISOString(),
        ...aiResult
      }
      
      setAnalysisResults(prev => [result, ...prev])
    } catch (error) {
      console.error('Analysis failed:', error)
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleExport = () => {
    const headers = ['Timestamp', 'Proposal ID', 'Compliant', 'Category', 'Risk Level', 'Reasoning', 'Recommendations']
    const rows = analysisResults.map(result => [
      result.timestamp,
      result.proposalId,
      result.is501c3Compliant.toString(),
      result.category,
      result.riskLevel,
      result.reasoning,
      result.recommendations
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nouns-501c3-analysis-${new Date().toISOString()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>501(c)(3) Compliance Analyzer</h1>
      
      <div className={styles.inputGroup}>
        <input
          type="text"
          value={proposalId}
          onChange={(e) => setProposalId(e.target.value)}
          placeholder="Enter Proposal ID"
          className={styles.input}
        />
        <button 
          onClick={handleFetchDescription}
          disabled={!proposalId.trim() || isLoading}
          className={styles.button}
        >
          {isLoading ? 'Loading...' : 'Fetch Description'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          Error: {error.message}
        </div>
      )}

      {analysisError && (
        <div className={styles.error}>
          Analysis Error: {analysisError}
        </div>
      )}

      {description && (
        <div className={styles.section}>
          <h2 className={styles.subtitle}>Proposal Description</h2>
          <div className={styles.description}>{description}</div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={styles.analyzeButton}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Compliance'}
          </button>
        </div>
      )}

      {analysisResults.length > 0 && (
        <div className={styles.section}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.subtitle}>Analysis Results</h2>
            <button onClick={handleExport} className={styles.exportButton}>
              Export to CSV
            </button>
          </div>
          
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>ID</th>
                  <th>Compliant</th>
                  <th>Category</th>
                  <th>Risk</th>
                  <th>Reasoning</th>
                  <th>Recommendations</th>
                </tr>
              </thead>
              <tbody>
                {analysisResults.map((result, index) => (
                  <tr key={index}>
                    <td>{new Date(result.timestamp).toLocaleString()}</td>
                    <td>{result.proposalId}</td>
                    <td>
                      <span className={result.is501c3Compliant ? styles.tagSuccess : styles.tagError}>
                        {result.is501c3Compliant ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>{result.category}</td>
                    <td>
                      <span className={
                        result.riskLevel === 'Low' ? styles.tagSuccess :
                        result.riskLevel === 'Medium' ? styles.tagWarning :
                        styles.tagError
                      }>
                        {result.riskLevel}
                      </span>
                    </td>
                    <td>{result.reasoning}</td>
                    <td>{result.recommendations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
} 