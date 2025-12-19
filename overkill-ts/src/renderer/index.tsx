import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Global type declaration for electronAPI
declare global {
  interface Window {
    electronAPI: {
      startPipeline: (repoPath: string, featureRequest: string) => Promise<{ success: boolean; specPath?: string; error?: string }>
      sendMessage: (message: string) => Promise<void>
      stopPipeline: () => Promise<void>
      pickDirectory: () => Promise<string | null>
      onAgentMessage: (callback: (msg: import('../shared/types').AgentMessage) => void) => () => void
      onWorkerStatus: (callback: (worker: import('../shared/types').WorkerInfo) => void) => () => void
      onPhaseChange: (callback: (phase: import('../shared/types').Phase) => void) => () => void
      onLog: (callback: (log: import('../shared/types').LogEntry) => void) => () => void
      onError: (callback: (error: string) => void) => () => void
      onPipelineComplete: (callback: (specPath: string) => void) => () => void
    }
  }
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
