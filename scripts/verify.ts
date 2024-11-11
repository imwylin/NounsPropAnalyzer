import { promises as fs } from 'fs'
import path from 'path'

async function verifyExports() {
  // Verify core exports
  const nounsContract = await import('../contracts/nounsDao')
  const proposalHooks = await import('../hooks/useProposalBatch')
  const analysisHooks = await import('../hooks/useProposalAnalysis')

  // Verify components
  const analysisComponents = await import('../components/analysis/ProposalAnalysisDashboard')
  const parserComponents = await import('../components/parser/AnalysisTable')

  // Verify types
  const nounsTypes = await import('../types/nouns')
  const parserTypes = await import('../types/parser')

  return {
    core: {
      contract: Object.keys(nounsContract).length > 0,
      proposalHooks: Object.keys(proposalHooks).length > 0,
      analysisHooks: Object.keys(analysisHooks).length > 0
    },
    components: {
      analysis: Object.keys(analysisComponents).length > 0,
      parser: Object.keys(parserComponents).length > 0
    },
    types: {
      nouns: Object.keys(nounsTypes).length > 0,
      parser: Object.keys(parserTypes).length > 0
    }
  }
}

async function verifyBuild() {
  try {
    // Run type checking
    const typeCheckResult = await new Promise((resolve, reject) => {
      const { exec } = require('child_process')
      exec('npx tsc --noEmit', (error: any, stdout: string) => {
        if (error) reject(error)
        resolve(stdout)
      })
    })

    // Run linting
    const lintResult = await new Promise((resolve, reject) => {
      const { exec } = require('child_process')
      exec('npm run lint', (error: any, stdout: string) => {
        if (error) reject(error)
        resolve(stdout)
      })
    })

    // Run build
    const buildResult = await new Promise((resolve, reject) => {
      const { exec } = require('child_process')
      exec('npm run build', (error: any, stdout: string) => {
        if (error) reject(error)
        resolve(stdout)
      })
    })

    return {
      typeCheck: typeCheckResult,
      lint: lintResult,
      build: buildResult
    }
  } catch (error) {
    console.error('Verification failed:', error)
    process.exit(1)
  }
}

async function main() {
  console.log('Starting verification...')

  const exportResults = await verifyExports()
  console.log('Export verification:', exportResults)

  const buildResults = await verifyBuild()
  console.log('Build verification:', buildResults)

  // Verify all checks passed
  const allExportsValid = Object.values(exportResults).every(category => 
    Object.values(category).every(Boolean)
  )

  if (!allExportsValid) {
    console.error('Export verification failed')
    process.exit(1)
  }

  console.log('Verification complete')
}

main().catch(error => {
  console.error('Verification failed:', error)
  process.exit(1)
}) 