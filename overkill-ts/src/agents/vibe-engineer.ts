/**
 * VibeEngineer Agent
 * Conducts vibe engineering conversation to crystallize decisions.
 * Uses Claude Agent SDK for real AI-powered conversations.
 *
 * CRITICAL: The system prompt below is the intellectual core of Overkill.
 * It must be preserved exactly as-is from the Python version.
 */

import { query } from '@anthropic-ai/claude-agent-sdk'
import type { AgentMessage, Decision } from './types'
import { v4 as uuidv4 } from 'uuid'

/**
 * THE DECISION-FORCING SYSTEM PROMPT
 *
 * This is the intellectual core of Overkill. It teaches Claude to:
 * 1. Present trade-offs as visual spectrums, not yes/no binaries
 * 2. Force explicit decisions out of the user
 * 3. Share opinions but let the user decide
 */
const VIBE_ENGINEER_SYSTEM_PROMPT = `You are a senior software engineer helping crystallize a fuzzy feature idea into concrete decisions.

YOUR MISSION: Ask questions that force explicit decisions. Present trade-offs as spectrums, not binaries.

STYLE:
- Talk like a thoughtful senior engineer thinking aloud
- Share your opinion but let the user decide
- Use spectrums to show trade-offs visually
- Ask open-ended questions, not yes/no
- Record decisions as you go

EXAMPLE GOOD QUESTION:
"I saw you're using Next.js with the App Router. For the hero section, there's a spectrum:

Static ◆━━━━━━━━━━━━━━━◆ Full interactive
→ Faster, SEO friendly      → More engaging
→ Less JS                   → More complex

Since this is a landing page, I'd lean toward static with maybe a subtle CSS animation.

What level of interactivity feels right for your use case?"

EXAMPLE BAD QUESTION:
"Do you want animations? (yes/no)"

FLOW:
1. Understand the feature deeply
2. Present options with trade-offs
3. Help user make explicit decisions
4. Confirm understanding
5. When you have enough info, say "SPEC_READY" and summarize all decisions

Remember: You're forcing decisions out of the black box, not making them yourself.

The user will tell you when they're ready to finish by saying "done" or similar.`

export interface EngineerCallbacks {
  onMessage: (msg: AgentMessage) => void
  onLog: (message: string, icon: string) => void
}

export interface EngineerSession {
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>
  repoAnalysis: { summary: string; path: string }
  featureRequest: string
  decisions: Decision[]
}

/**
 * Extract session_id from SDK messages
 */
function extractSessionId(messages: AsyncGenerator<unknown>): Promise<string | null> {
  return new Promise(async (resolve) => {
    try {
      for await (const msg of messages) {
        if (msg && typeof msg === 'object' && 'session_id' in msg) {
          resolve((msg as { session_id: string }).session_id)
          return
        }
      }
      resolve(null)
    } catch {
      resolve(null)
    }
  })
}

/**
 * Extract text content from SDK assistant message
 */
function extractTextContent(message: unknown): string {
  if (!message || typeof message !== 'object') return ''

  const msg = message as { type?: string; message?: { content?: unknown } }
  if (msg.type !== 'assistant') return ''

  const content = msg.message?.content
  if (!content) return ''

  if (typeof content === 'string') return content

  if (Array.isArray(content)) {
    return content
      .filter((block): block is { type: 'text'; text: string } => block?.type === 'text')
      .map((block) => block.text)
      .join('')
  }

  return ''
}

/**
 * Run a single query turn and collect results
 */
async function runSingleTurn(
  prompt: string,
  cwd: string,
  sessionId?: string
): Promise<{ text: string; sessionId: string | null; numTurns: number }> {
  const result = query({
    prompt,
    options: {
      cwd,
      systemPrompt: VIBE_ENGINEER_SYSTEM_PROMPT,
      tools: [], // No tools for engineer - pure conversation
      permissionMode: 'default',
      maxTurns: 1,
      ...(sessionId ? { resume: sessionId } : {}),
    },
  })

  let text = ''
  let extractedSessionId: string | null = null
  let numTurns = 0

  for await (const message of result) {
    // Extract session_id from any message
    if (!extractedSessionId && message && 'session_id' in message) {
      extractedSessionId = (message as { session_id: string }).session_id
    }

    // Extract text from assistant messages
    const msgText = extractTextContent(message)
    if (msgText) {
      text = msgText
    }

    // Get turn count from result
    if (message && typeof message === 'object' && 'type' in message) {
      const m = message as { type: string; num_turns?: number }
      if (m.type === 'result' && m.num_turns) {
        numTurns = m.num_turns
      }
    }
  }

  return { text, sessionId: extractedSessionId, numTurns }
}

/**
 * Run the VibeEngineer agent for interactive conversation.
 * Uses multiple single-turn queries with session resume for multi-turn.
 */
export async function runVibeEngineer(
  repoAnalysis: { summary: string; path: string },
  featureRequest: string,
  callbacks: EngineerCallbacks,
  getUserInput: () => Promise<string>
): Promise<EngineerSession> {
  const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  const decisions: Decision[] = []

  callbacks.onLog('Vibe engineering session started', '🎯')
  callbacks.onLog(`Feature: ${featureRequest.slice(0, 50)}...`, '📋')

  // Build initial prompt
  const initialPrompt = `Repository Analysis:
${repoAnalysis.summary}

Feature Request: ${featureRequest}

Start the vibe engineering conversation. Ask your first question to understand what the user really wants.`

  let currentSessionId: string | null = null

  try {
    // First turn - initial question
    callbacks.onLog('Generating initial question...', '💭')
    const firstTurn = await runSingleTurn(initialPrompt, repoAnalysis.path)

    currentSessionId = firstTurn.sessionId

    if (firstTurn.text) {
      conversationHistory.push({ role: 'assistant', content: firstTurn.text })
      callbacks.onMessage({
        id: uuidv4(),
        role: 'agent',
        content: firstTurn.text,
        timestamp: Date.now(),
      })

      if (firstTurn.text.includes('SPEC_READY')) {
        callbacks.onLog('Ready to generate SPEC', '✅')
        return {
          conversation: conversationHistory,
          repoAnalysis,
          featureRequest,
          decisions,
        }
      }
    }

    // Conversation loop
    let turnCount = 0
    const maxTurns = 10

    while (turnCount < maxTurns) {
      // Get user input
      const userInput = await getUserInput()

      if (!userInput || userInput === '__CANCELLED__') {
        callbacks.onLog('Session cancelled', '⚠️')
        break
      }

      conversationHistory.push({ role: 'user', content: userInput })

      // Check for termination signals
      const lowerInput = userInput.toLowerCase().trim()
      if (['done', 'exit', 'quit', 'finish'].includes(lowerInput)) {
        callbacks.onLog('User requested finish', '✅')
        break
      }

      turnCount++
      callbacks.onLog(`Processing turn ${turnCount}...`, '💭')

      // Run next turn with user's input
      const turn = await runSingleTurn(
        userInput,
        repoAnalysis.path,
        currentSessionId || undefined
      )

      if (turn.sessionId) {
        currentSessionId = turn.sessionId
      }

      if (turn.text) {
        conversationHistory.push({ role: 'assistant', content: turn.text })
        callbacks.onMessage({
          id: uuidv4(),
          role: 'agent',
          content: turn.text,
          timestamp: Date.now(),
        })

        if (turn.text.includes('SPEC_READY')) {
          callbacks.onLog('Ready to generate SPEC', '✅')
          break
        }
      }
    }

    callbacks.onLog('Engineering session complete', '✅')

    return {
      conversation: conversationHistory,
      repoAnalysis,
      featureRequest,
      decisions,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    callbacks.onLog(`SDK error: ${errorMessage}, using fallback`, '⚠️')

    // Fall back to simulated conversation if SDK fails
    return runSimulatedConversation(
      repoAnalysis,
      featureRequest,
      callbacks,
      getUserInput,
      conversationHistory
    )
  }
}

/**
 * Fallback simulated conversation when SDK is unavailable
 */
async function runSimulatedConversation(
  repoAnalysis: { summary: string; path: string },
  featureRequest: string,
  callbacks: EngineerCallbacks,
  getUserInput: () => Promise<string>,
  existingHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<EngineerSession> {
  const conversationHistory = existingHistory
  const decisions: Decision[] = []

  callbacks.onLog('Using fallback conversation mode', '⚠️')

  // Only send first response if we don't have any assistant messages yet
  const hasAssistantMessage = conversationHistory.some((h) => h.role === 'assistant')

  if (!hasAssistantMessage) {
    const firstResponse = generateFirstQuestion(repoAnalysis, featureRequest)
    conversationHistory.push({ role: 'assistant', content: firstResponse })

    callbacks.onMessage({
      id: uuidv4(),
      role: 'agent',
      content: firstResponse,
      timestamp: Date.now(),
    })
  }

  // Conversation loop
  let turnCount = 0
  while (turnCount < 5) {
    const userInput = await getUserInput()

    if (!userInput || userInput === '__CANCELLED__') {
      break
    }

    conversationHistory.push({ role: 'user', content: userInput })

    const lowerInput = userInput.toLowerCase().trim()
    if (['done', 'exit', 'quit', 'finish'].includes(lowerInput)) {
      break
    }

    turnCount++

    // Generate next response based on turn count
    let response: string
    switch (turnCount) {
      case 1:
        response = generateArchitectureQuestion()
        break
      case 2:
        response = generateUIQuestion()
        break
      default:
        response = generateSpecReadyMessage(featureRequest, conversationHistory)
        break
    }

    conversationHistory.push({ role: 'assistant', content: response })

    callbacks.onMessage({
      id: uuidv4(),
      role: 'agent',
      content: response,
      timestamp: Date.now(),
    })

    if (response.includes('SPEC_READY')) {
      break
    }
  }

  return {
    conversation: conversationHistory,
    repoAnalysis,
    featureRequest,
    decisions,
  }
}

function generateFirstQuestion(
  repoAnalysis: { summary: string; path: string },
  featureRequest: string
): string {
  const repoName = repoAnalysis.path.split('/').pop() || 'the repository'

  return `Salut! J'ai analysé **${repoName}** et je vois que tu veux:

> "${featureRequest}"

Avant de plonger dans les détails, laisse-moi comprendre ta vision.

**Quel est l'objectif principal de cette feature?**

Quick win ◆━━━━━━━━━━━━━━━◆ Foundation
→ Résoudre un problème immédiat    → Poser les bases pour le futur
→ Livraison rapide                 → Plus de flexibilité
→ Scope limité                     → Investissement initial

Où te situes-tu sur ce spectrum? Dis-moi aussi le contexte: c'est pour toi, un client, un projet open source?`
}

function generateArchitectureQuestion(): string {
  return `Je vois mieux maintenant. Parlons architecture.

**Comment vois-tu l'organisation du code?**

Monolithique ◆━━━━━━━━━━━━━━━◆ Modulaire
→ Tout dans un fichier/module      → Séparation claire
→ Simple à comprendre              → Facile à tester
→ Refactor plus tard               → Structure dès le départ

**Et pour les dépendances externes?**

Minimal ◆━━━━━━━━━━━━━━━◆ Libraries
→ Moins de deps = moins de risques → Plus rapide à implémenter
→ Code maison                      → Battle-tested

Partage-moi tes préférences. Je note tout pour le SPEC.`
}

function generateUIQuestion(): string {
  return `Excellent! On avance bien.

**Pour l'interface (si applicable):**

Fonctionnel d'abord ◆━━━━━━━━━━━━━━━◆ Design d'abord
→ Ça marche, on polish après       → UX soignée dès le start
→ Itération rapide                 → Moins de refactor UI

**Niveau de complexité UI:**

Basique ◆━━━━━━━━━━━━━━━◆ Élaboré
→ Formulaires simples              → Animations, transitions
→ Native browser components        → Custom design system

Si t'as assez discuté et que tu veux que je génère le SPEC, tape **done**.
Sinon, dis-moi tes préférences et on continue.`
}

function generateSpecReadyMessage(
  featureRequest: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): string {
  const userMessages = history.filter((h) => h.role === 'user').map((h) => h.content)

  return `SPEC_READY!

**Récapitulatif des décisions:**

1. **Feature**: ${featureRequest}
2. **Approche**: Basée sur notre discussion
3. **Points clés décidés**:
${userMessages.map((m, i) => `   - Échange ${i + 1}: "${m.slice(0, 50)}..."`).join('\n')}

Je vais maintenant générer le **SPEC.md** avec:
- Le contexte complet
- Toutes les décisions techniques
- Les fichiers à créer/modifier
- Les étapes d'implémentation
- Les contraintes à respecter

Le fichier sera prêt pour être exécuté par Claude Code ou n'importe quel dev.`
}

export { VIBE_ENGINEER_SYSTEM_PROMPT }
