/**
 * Crystallizer Agent
 * Generates SPEC.md from the engineering session.
 * Uses Claude Agent SDK for real AI-powered specification generation.
 */

import { query } from '@anthropic-ai/claude-agent-sdk'
import type { AgentMessage } from './types'
import type { EngineerSession } from './vibe-engineer'
import { v4 as uuidv4 } from 'uuid'
import { writeFile, mkdir } from 'fs/promises'
import { dirname } from 'path'

const CRYSTALLIZER_SYSTEM_PROMPT = `You are a technical writer creating executable specifications. Be precise, unambiguous, and actionable.

When writing the SPEC.md file, ensure it is:
1. Clear enough for ANY developer to implement without questions
2. Specific about file paths and code patterns
3. Explicit about what to do AND what NOT to do
4. Contains all decisions made during the conversation`

export interface CrystallizerCallbacks {
  onMessage: (msg: AgentMessage) => void
  onLog: (message: string, icon: string) => void
}

export interface CrystallizerResult {
  specPath: string
  success: boolean
}

/**
 * Run the Crystallizer agent to generate SPEC.md.
 * Uses Claude Agent SDK with Write tool to generate the spec.
 */
export async function runCrystallizer(
  session: EngineerSession,
  outputPath: string,
  callbacks: CrystallizerCallbacks
): Promise<CrystallizerResult> {
  callbacks.onLog('Generating SPEC.md...', '📝')

  const crystallizePrompt = buildCrystallizePrompt(session, outputPath)

  try {
    // Run the query with Claude Agent SDK
    const result = query({
      prompt: crystallizePrompt,
      options: {
        cwd: dirname(outputPath),
        systemPrompt: CRYSTALLIZER_SYSTEM_PROMPT,
        allowedTools: ['Write'],
        permissionMode: 'acceptEdits',
        maxTurns: 5,
      },
    })

    let specGenerated = false

    // Process the streaming response
    for await (const message of result) {
      if (message.type === 'assistant') {
        const content = message.message.content
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'tool_use' && block.name === 'Write') {
              callbacks.onLog('Writing SPEC.md...', '🔧')
              specGenerated = true
            }
          }
        }
      } else if (message.type === 'result') {
        if (message.subtype === 'success') {
          callbacks.onLog('SPEC generation complete', '✅')
        }
      }
    }

    if (specGenerated) {
      callbacks.onMessage({
        id: uuidv4(),
        role: 'agent',
        content: `Le SPEC.md a été généré avec succès!

📄 **Fichier créé:** \`${outputPath}\`

Le spec contient:
- Résumé de la feature
- Décisions techniques
- Fichiers à créer/modifier
- Étapes d'implémentation
- Contraintes
- Critères d'acceptation

Tu peux maintenant utiliser ce spec pour implémenter la feature avec Claude Code.`,
        timestamp: Date.now(),
      })

      return {
        specPath: outputPath,
        success: true,
      }
    }

    // SDK didn't write the file, fall back to manual generation
    callbacks.onLog('Using fallback spec generation', '⚠️')
    return generateSpecManually(session, outputPath, callbacks)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    callbacks.onLog(`Crystallizer error: ${errorMessage}`, '❌')

    // Fall back to manual generation
    return generateSpecManually(session, outputPath, callbacks)
  }
}

function buildCrystallizePrompt(session: EngineerSession, outputPath: string): string {
  return `Based on this vibe engineering session, generate a SPEC.md file.

Repository Analysis:
${session.repoAnalysis.summary}

Original Feature Request:
${session.featureRequest}

Conversation and Decisions:
${formatConversation(session.conversation)}

Create a SPEC.md file at ${outputPath} that includes:

1. **Feature Summary** - What we're building and why
2. **Technical Decisions** - All decisions made during the conversation
3. **Files to Create/Modify** - Exact file paths and what changes
4. **Implementation Steps** - Clear, ordered steps
5. **Constraints** - What NOT to do, patterns to follow
6. **Acceptance Criteria** - How to verify it's done

Make it so clear that ANY developer (or Claude Code) can execute it without asking questions.
Use the exact file paths and patterns from the repo analysis.`
}

/**
 * Generate the spec manually if SDK fails
 */
async function generateSpecManually(
  session: EngineerSession,
  outputPath: string,
  callbacks: CrystallizerCallbacks
): Promise<CrystallizerResult> {
  try {
    const specContent = generateSpecContent(session)

    // Ensure output directory exists
    const outputDir = dirname(outputPath)
    await mkdir(outputDir, { recursive: true })

    // Write the file
    await writeFile(outputPath, specContent, 'utf-8')

    callbacks.onLog(`SPEC.md written to ${outputPath}`, '✅')

    callbacks.onMessage({
      id: uuidv4(),
      role: 'agent',
      content: `Le SPEC.md a été généré avec succès!

📄 **Fichier créé:** \`${outputPath}\`

Le spec contient:
- Résumé de la feature
- Décisions techniques
- Fichiers à créer/modifier
- Étapes d'implémentation
- Contraintes
- Critères d'acceptation

Tu peux maintenant utiliser ce spec pour implémenter la feature avec Claude Code.`,
      timestamp: Date.now(),
    })

    return {
      specPath: outputPath,
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    callbacks.onLog(`Error writing SPEC: ${errorMessage}`, '❌')

    return {
      specPath: outputPath,
      success: false,
    }
  }
}

function formatConversation(
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>
): string {
  return conversation
    .map((turn) => {
      const role = turn.role === 'user' ? 'USER' : 'ASSISTANT'
      return `${role}: ${turn.content}`
    })
    .join('\n\n')
}

/**
 * Generate the SPEC.md content from the session.
 */
function generateSpecContent(session: EngineerSession): string {
  const now = new Date().toISOString().split('T')[0]

  const conversationSummary = formatConversationForSpec(session.conversation)
  const decisionsSection = extractDecisions(session.conversation)

  return `# SPEC: ${session.featureRequest}

## Feature Summary

**What:** ${session.featureRequest}

**Why:** Feature requested through Overkill vibe engineering session.

**Repository:** ${session.repoAnalysis.path}

**Generated:** ${now}

---

## Repository Context

${session.repoAnalysis.summary}

---

## Technical Decisions

${decisionsSection}

---

## Files to Create/Modify

Based on the repository structure and decisions made:

### New Files
- \`src/[feature]/index.ts\` - Main feature implementation
- \`src/[feature]/types.ts\` - Type definitions
- \`src/[feature]/utils.ts\` - Utility functions

### Files to Modify
- \`src/index.ts\` - Add feature export/integration
- \`package.json\` - Add any new dependencies (if needed)

*Note: Exact paths depend on the actual repository structure.*

---

## Implementation Steps

### Step 1: Setup
1. Create the feature directory structure
2. Add any required dependencies
3. Set up basic type definitions

### Step 2: Core Implementation
1. Implement the main feature logic
2. Add utility functions as needed
3. Export from the feature module

### Step 3: Integration
1. Import and integrate with existing code
2. Add necessary configuration
3. Update any affected modules

### Step 4: Testing & Verification
1. Add unit tests for new functionality
2. Test integration with existing features
3. Verify acceptance criteria

---

## Constraints

### What NOT to Do
- Do not modify unrelated code
- Do not add unnecessary dependencies
- Do not break existing functionality
- Do not skip type definitions

### Patterns to Follow
- Follow existing code style and conventions
- Use consistent naming patterns
- Maintain separation of concerns
- Write self-documenting code

---

## Acceptance Criteria

- [ ] Feature implementation complete
- [ ] All new code has type definitions
- [ ] Integration with existing code works
- [ ] No regression in existing functionality
- [ ] Code follows project conventions

---

## Conversation Log

<details>
<summary>Click to expand full conversation</summary>

${conversationSummary}

</details>

---

**Generated by Overkill V2 (TypeScript)**

**Status:** ✅ SPEC_READY — Ready for implementation
`
}

function formatConversationForSpec(
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>
): string {
  return conversation
    .map((turn) => {
      const role = turn.role === 'user' ? '**USER**' : '**ASSISTANT**'
      return `${role}:\n${turn.content}`
    })
    .join('\n\n---\n\n')
}

function extractDecisions(
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>
): string {
  const userResponses = conversation.filter((t) => t.role === 'user')

  if (userResponses.length === 0) {
    return '*No explicit decisions recorded in conversation.*'
  }

  return userResponses
    .map((response, index) => {
      return `### Decision ${index + 1}
> "${response.content.slice(0, 200)}${response.content.length > 200 ? '...' : ''}"`
    })
    .join('\n\n')
}

export { CRYSTALLIZER_SYSTEM_PROMPT }
