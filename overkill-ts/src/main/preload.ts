import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import type { AgentMessage, WorkerInfo, Phase, PipelineResult, LogEntry } from '../shared/types'

// Type-safe API exposed to renderer
const electronAPI = {
  // Renderer -> Main (invoke/handle)
  startPipeline: (repoPath: string, featureRequest: string): Promise<PipelineResult> =>
    ipcRenderer.invoke(IPC_CHANNELS.AGENT_START, repoPath, featureRequest),

  sendMessage: (message: string): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.AGENT_SEND_MESSAGE, message),

  stopPipeline: (): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.AGENT_STOP),

  pickDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.FILE_PICKER),

  // Main -> Renderer (send/on) with cleanup functions
  onAgentMessage: (callback: (msg: AgentMessage) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, msg: AgentMessage) => callback(msg)
    ipcRenderer.on(IPC_CHANNELS.AGENT_MESSAGE, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.AGENT_MESSAGE, handler)
  },

  onWorkerStatus: (callback: (worker: WorkerInfo) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, worker: WorkerInfo) => callback(worker)
    ipcRenderer.on(IPC_CHANNELS.WORKER_STATUS, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.WORKER_STATUS, handler)
  },

  onPhaseChange: (callback: (phase: Phase) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, phase: Phase) => callback(phase)
    ipcRenderer.on(IPC_CHANNELS.PHASE_CHANGE, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.PHASE_CHANGE, handler)
  },

  onLog: (callback: (log: LogEntry) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, log: LogEntry) => callback(log)
    ipcRenderer.on(IPC_CHANNELS.AGENT_LOG, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.AGENT_LOG, handler)
  },

  onError: (callback: (error: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, error: string) => callback(error)
    ipcRenderer.on(IPC_CHANNELS.AGENT_ERROR, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.AGENT_ERROR, handler)
  },

  onPipelineComplete: (callback: (specPath: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, specPath: string) => callback(specPath)
    ipcRenderer.on(IPC_CHANNELS.PIPELINE_COMPLETE, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.PIPELINE_COMPLETE, handler)
  },
}

// Expose the API to the renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type declaration for the renderer
export type ElectronAPI = typeof electronAPI
