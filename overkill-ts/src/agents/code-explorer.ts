/**
 * CodeExplorer Agent
 * Analyzes a repository to understand its structure and patterns.
 * Uses Claude Agent SDK for real AI-powered analysis.
 */

import { query } from '@anthropic-ai/claude-agent-sdk'
import type { WorkerInfo } from './types'

const EXPLORER_SYSTEM_PROMPT = `You are a senior software engineer analyzing a codebase. Focus on: stack, structure, patterns, conventions, and where features typically live.

Be concise but thorough. Focus on actionable insights that will help with feature implementation.`

const ANALYSIS_PROMPT = `Analyze this repository and provide:

1. **Stack**: What technologies, frameworks, languages are used?
2. **Structure**: How is the code organized? What are the main directories?
3. **Patterns**: What patterns do you see? (architecture, naming, styling)
4. **Conventions**: Code style, file organization conventions
5. **Integration points**: Where would new features typically be added?

Be concise but thorough. Focus on actionable insights.`

export interface ExplorerCallbacks {
  onWorkerStatus: (worker: WorkerInfo) => void
  onLog: (message: string, icon: string) => void
}

export interface ExplorerResult {
  summary: string
  path: string
}

/**
 * Run the CodeExplorer agent to analyze a repository.
 * Uses Claude Agent SDK with Read, Grep, Glob, and Bash tools.
 */
export async function runCodeExplorer(
  repoPath: string,
  callbacks: ExplorerCallbacks
): Promise<ExplorerResult> {
  callbacks.onWorkerStatus({
    id: 'code-explorer',
    type: 'code-explorer',
    status: 'running',
    progress: 'Initializing...',
  })

  callbacks.onLog('Starting repository analysis', '🔍')

  let analysisText = ''

  try {
    callbacks.onWorkerStatus({
      id: 'code-explorer',
      type: 'code-explorer',
      status: 'running',
      progress: 'Analyzing repository structure...',
    })

    // Run the query with Claude Agent SDK
    const result = query({
      prompt: ANALYSIS_PROMPT,
      options: {
        cwd: repoPath,
        systemPrompt: EXPLORER_SYSTEM_PROMPT,
        allowedTools: ['Read', 'Grep', 'Glob', 'Bash'],
        permissionMode: 'acceptEdits',
        maxTurns: 10,
      },
    })

    // Process the streaming response
    for await (const message of result) {
      if (message.type === 'assistant') {
        // Extract text content from assistant message
        const content = message.message.content
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'text') {
              analysisText += block.text
            } else if (block.type === 'tool_use') {
              // Log tool usage
              callbacks.onLog(`Using ${block.name}...`, '🔧')
            }
          }
        } else if (typeof content === 'string') {
          analysisText += content
        }
      } else if (message.type === 'result') {
        // Final result
        if (message.subtype === 'success' && message.result) {
          analysisText = message.result
        }
        callbacks.onLog(`Analysis complete (${message.num_turns} turns)`, '📊')
      }
    }

    callbacks.onWorkerStatus({
      id: 'code-explorer',
      type: 'code-explorer',
      status: 'completed',
      output: analysisText,
    })

    callbacks.onLog('Repository analysis complete', '✅')

    return {
      summary: analysisText || generateFallbackSummary(repoPath),
      path: repoPath,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    callbacks.onLog(`Analysis error: ${errorMessage}`, '❌')

    callbacks.onWorkerStatus({
      id: 'code-explorer',
      type: 'code-explorer',
      status: 'error',
      error: errorMessage,
    })

    // Return a fallback summary on error
    return {
      summary: generateFallbackSummary(repoPath),
      path: repoPath,
    }
  }
}

function generateFallbackSummary(repoPath: string): string {
  const repoName = repoPath.split('/').pop() || 'repository'

  return `## Repository Analysis: ${repoName}

*Note: Automated analysis was not available. Using fallback summary.*

### Repository Path
\`${repoPath}\`

### Recommended Analysis Steps
1. Check package.json or equivalent for dependencies
2. Review src/ directory structure
3. Look for README.md for project documentation
4. Identify entry points (index.ts, main.ts, etc.)

Please describe your repository structure for better feature specification.`
}

export { EXPLORER_SYSTEM_PROMPT, ANALYSIS_PROMPT }
