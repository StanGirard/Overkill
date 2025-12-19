export interface AgentMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: number
}

export type WorkerType = 'code-explorer' | 'researcher' | 'dependency-checker' | 'pattern-matcher'

export type WorkerStatus = 'idle' | 'running' | 'completed' | 'error'

export interface WorkerInfo {
  id: string
  type: WorkerType
  status: WorkerStatus
  progress?: string
  output?: string
  error?: string
}

export type Phase = 'idle' | 'explore' | 'engineer' | 'crystallize' | 'complete'

export interface ConversationContext {
  repoPath: string
  featureRequest: string
  messages: AgentMessage[]
  repoAnalysis?: string
  decisions: Decision[]
}

export interface Decision {
  topic: string
  choice: string
  rationale: string
}

export interface PipelineResult {
  success: boolean
  specPath?: string
  error?: string
}

export interface UICallbacks {
  onMessage: (msg: AgentMessage) => void
  onPhaseChange: (phase: Phase) => void
  onWorkerStatus: (worker: WorkerInfo) => void
  onComplete: (specPath: string) => void
  onError: (error: Error) => void
}
