export const IPC_CHANNELS = {
  // Renderer -> Main (invoke/handle)
  AGENT_START: 'agent:start',
  AGENT_SEND_MESSAGE: 'agent:sendMessage',
  AGENT_STOP: 'agent:stop',
  FILE_PICKER: 'dialog:openDirectory',

  // Main -> Renderer (send/on)
  AGENT_MESSAGE: 'agent:message',
  AGENT_STATUS: 'agent:status',
  WORKER_STATUS: 'worker:status',
  PHASE_CHANGE: 'phase:change',
  AGENT_LOG: 'agent:log',
  AGENT_ERROR: 'agent:error',
  PIPELINE_COMPLETE: 'pipeline:complete',
} as const

export type IpcChannelKey = keyof typeof IPC_CHANNELS
export type IpcChannelValue = (typeof IPC_CHANNELS)[IpcChannelKey]
