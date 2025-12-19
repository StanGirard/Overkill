// Re-export shared types for agents
export type {
  AgentMessage,
  WorkerType,
  WorkerStatus,
  WorkerInfo,
  Phase,
  ConversationContext,
  Decision,
  PipelineResult,
  UICallbacks,
} from '../shared/types'

// Agent-specific types

export interface AgentOptions {
  repoPath: string
  systemPrompt: string
  allowedTools: string[]
  permissionMode?: 'default' | 'acceptEdits'
}

export interface ExplorerResult {
  summary: string
  path: string
}

export interface EngineerSession {
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>
  repoAnalysis: string
  featureRequest: string
  decisions: Array<{ topic: string; choice: string; rationale: string }>
}

export interface CrystallizerResult {
  specPath: string
  success: boolean
}
