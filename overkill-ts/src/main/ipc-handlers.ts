/**
 * IPC Handlers
 * Registers all IPC handlers for communication between main and renderer processes.
 */

import { ipcMain, BrowserWindow, dialog } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import type { PipelineResult } from '../shared/types'
import { AgentController } from './agent-controller'

let agentController: AgentController | null = null

export function setupIpcHandlers(window: BrowserWindow): void {
  // Create the agent controller
  agentController = new AgentController(window)

  // Start the pipeline
  ipcMain.handle(
    IPC_CHANNELS.AGENT_START,
    async (_event, repoPath: string, featureRequest: string): Promise<PipelineResult> => {
      if (!agentController) {
        return { success: false, error: 'Agent controller not initialized' }
      }
      return agentController.startPipeline(repoPath, featureRequest)
    }
  )

  // Send user message to the agent
  ipcMain.handle(IPC_CHANNELS.AGENT_SEND_MESSAGE, async (_event, message: string): Promise<void> => {
    if (agentController) {
      agentController.handleUserMessage(message)
    }
  })

  // Stop the pipeline
  ipcMain.handle(IPC_CHANNELS.AGENT_STOP, async (): Promise<void> => {
    if (agentController) {
      agentController.stopPipeline()
    }
  })

  // File picker
  ipcMain.handle(IPC_CHANNELS.FILE_PICKER, async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
      title: 'Select Repository',
      buttonLabel: 'Select',
    })

    return result.canceled ? null : result.filePaths[0] ?? null
  })
}
