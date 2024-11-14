import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import { useProposalDescription } from '../hooks/useSubgraphProposals'
import { analyzeProposal } from '../utils/ai/analyzeProposal'
import type { AIAnalysisResult } from '../types/graphql'
import styles from './analyze.module.css'
import Image from 'next/image'

interface AnalysisResultWithMeta extends AIAnalysisResult {
  proposalId: string
  timestamp: string
}

interface AnalysisStatus {
  attempt: number;
  state: 'pending' | 'running' | 'success' | 'error';
  error?: string;
}

// Add this component for custom image rendering
const MarkdownComponents = {
  img: ({ node, ...props }: any) => {
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (!props.src || isError) {
      return null; // Don't render anything if src is missing or there's an error
    }

    return (
      <div className={styles.imageWrapper}>
        <Image
          src={props.src}
          alt={props.alt || ''}
          width={800}
          height={400}
          className={`${styles.markdownImage} ${!isLoading ? styles.loaded : ''}`}
          unoptimized
          onError={() => setIsError(true)}
          onLoad={() => setIsLoading(false)}
        />
        {isLoading && <div className={styles.imageLoader}>Loading...</div>}
      </div>
    );
  },
}

const StatusIcon = ({ state }: { state: string }) => {
  switch (state) {
    case 'pending':
      return (
        <svg className={styles.statusIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'running':
      return (
        <svg className={`${styles.statusIcon} ${styles.spinning}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'success':
      return (
        <svg className={styles.statusIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 13l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'error':
      return (
        <svg className={styles.statusIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

export default function AnalyzePage() {
  const [proposalId, setProposalId] = useState('')
  const [analysisResults, setAnalysisResults] = useState<AnalysisResultWithMeta[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<number>(1)
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus[]>([])
  
  const { 
    data: description,
    isLoading,
    error 
  } = useProposalDescription(proposalId)

  const handleAnalyze = async () => {
    if (!description) return
    setIsAnalyzing(true)
    setAnalysisResults([]) // Clear previous results
    setAnalysisStatus([
      { attempt: 1, state: 'pending' },
      { attempt: 2, state: 'pending' }
    ])

    try {
      // First Analysis
      setAnalysisStatus(prev => [
        { ...prev[0], state: 'running' },
        prev[1]
      ])
      
      const firstAnalysis = await analyzeProposal(description, selectedPrompt)
      
      setAnalysisStatus(prev => [
        { ...prev[0], state: 'success' },
        prev[1]
      ])
      
      setAnalysisResults([{
        ...firstAnalysis,
        proposalId,
        timestamp: new Date().toISOString()
      }])
      
      // Wait before second analysis
      await new Promise(resolve => setTimeout(resolve, 10000))
      
      // Second Analysis
      setAnalysisStatus(prev => [
        prev[0],
        { ...prev[1], state: 'running' }
      ])
      
      const secondAnalysis = await analyzeProposal(description, selectedPrompt)
      
      setAnalysisStatus(prev => [
        prev[0],
        { ...prev[1], state: 'success' }
      ])

      setAnalysisResults(prev => [...prev, {
        ...secondAnalysis,
        proposalId,
        timestamp: new Date().toISOString()
      }])

    } catch (error) {
      console.error('Analysis failed:', error)
      setAnalysisStatus(prev => prev.map(status => 
        status.state === 'running' ? { ...status, state: 'error', error: 'Analysis failed' } : status
      ))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleExport = () => {
    // Implementation of export functionality
    // (We'll keep the existing export logic)
  }

  const renderComparisonTable = (results: AnalysisResultWithMeta[]) => {
    return (
      <table className={styles.comparisonTable}>
        <thead>
          <tr>
            <th>Aspect</th>
            {results.map((result, index) => (
              <th key={index}>Analysis {index + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Classification</td>
            {results.map((result, index) => (
              <td key={index}>{result.classification}</td>
            ))}
          </tr>
          <tr>
            <td>Primary Purpose</td>
            {results.map((result, index) => (
              <td key={index}>{result.primary_purpose}</td>
            ))}
          </tr>
          <tr>
            <td>Private Benefit Risk</td>
            {results.map((result, index) => (
              <td key={index}>{result.risk_assessment.private_benefit_risk}</td>
            ))}
          </tr>
          <tr>
            <td>Mission Alignment</td>
            {results.map((result, index) => (
              <td key={index}>{result.risk_assessment.mission_alignment}</td>
            ))}
          </tr>
          <tr>
            <td>Implementation Complexity</td>
            {results.map((result, index) => (
              <td key={index}>{result.risk_assessment.implementation_complexity}</td>
            ))}
          </tr>
          <tr>
            <td>Allowable Elements</td>
            {results.map((result, index) => (
              <td key={index}>
                <ul className={styles.elementList}>
                  {result.allowable_elements.map((element, i) => (
                    <li key={i}>{element}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
          <tr>
            <td>Unallowable Elements</td>
            {results.map((result, index) => (
              <td key={index}>
                <ul className={styles.elementList}>
                  {result.unallowable_elements.map((element, i) => (
                    <li key={i}>{element}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
          <tr>
            <td>Required Modifications</td>
            {results.map((result, index) => (
              <td key={index}>
                <ul className={styles.elementList}>
                  {result.required_modifications.map((mod, i) => (
                    <li key={i}>{mod}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
          <tr>
            <td>Key Considerations</td>
            {results.map((result, index) => (
              <td key={index}>
                <ul className={styles.elementList}>
                  {result.key_considerations.map((consideration, i) => (
                    <li key={i}>{consideration}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Proposal Analysis</h1>
      
      <div className={styles.header}>
        <div className={styles.inputSection}>
          <input
            type="text"
            value={proposalId}
            onChange={(e) => setProposalId(e.target.value)}
            placeholder="Enter Proposal ID"
            className={styles.input}
          />
          
          <select
            value={selectedPrompt}
            onChange={(e) => setSelectedPrompt(Number(e.target.value))}
            className={styles.select}
            disabled={isAnalyzing}
          >
            <option value={1}>Moderate Analysis</option>
            <option value={2}>Hawkish Analysis</option>
            <option value={3}>Innovative Analysis</option>
          </select>

          <button 
            onClick={handleAnalyze}
            disabled={!description || isAnalyzing || isLoading}
            className={styles.analyzeButton}
          >
            {isLoading ? 'Loading...' : isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            Proposal not found. Please check the ID and try again.
          </div>
        )}
      </div>

      <div className={styles.splitView}>
        <div className={styles.proposalPanel}>
          {description && (
            <div className={styles.proposalContent}>
              <h2>Proposal {proposalId}</h2>
              <ReactMarkdown 
                remarkPlugins={[remarkBreaks]}
                components={MarkdownComponents}
              >
                {description}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className={styles.analysisPanel}>
          {analysisStatus.length > 0 && (
            <div className={styles.statusBar}>
              {analysisStatus.map((status, index) => (
                <div 
                  key={index} 
                  className={`${styles.statusPill} ${styles[status.state]}`}
                >
                  <StatusIcon state={status.state} />
                  <div className={styles.statusInfo}>
                    <span className={styles.statusTitle}>Analysis {index + 1}</span>
                    <span className={styles.statusLabel}>
                      {status.state === 'pending' && 'Queued for analysis...'}
                      {status.state === 'running' && 'Analyzing proposal...'}
                      {status.state === 'success' && 'Analysis complete'}
                      {status.state === 'error' && 'Analysis failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {analysisResults.length > 0 && (
            <div className={styles.results}>
              <div className={styles.resultActions}>
                <button onClick={handleExport} className={styles.exportButton}>
                  Export Results
                </button>
              </div>
              
              <div className={styles.comparisonGrid}>
                {renderComparisonTable(analysisResults)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
