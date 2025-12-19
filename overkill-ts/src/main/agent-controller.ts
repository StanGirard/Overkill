/**
 * AgentController
 * Orchestrates the 3-phase pipeline: Explorer → Engineer → Crystallizer
 */

import { BrowserWindow } from 'electron'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import type { AgentMessage, WorkerInfo, Phase, PipelineResult } from '../shared/types'
import { runCodeExplorer } from '../agents/code-explorer'
import { runVibeEngineer } from '../agents/vibe-engineer'
import { runCrystallizer } from '../agents/crystallizer'

export class AgentController {
  private mainWindow: BrowserWindow
  private userInputResolve: ((value: string) => void) | null = null
  private conversationHistory: AgentMessage[] = []
  private isRunning = false

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  /**
   * Start the full pipeline
   */
  async startPipeline(repoPath: string, featureRequest: string): Promise<PipelineResult> {
    if (this.isRunning) {
      return { success: false, error: 'Pipeline is already running' }
    }

    this.isRunning = true
    this.conversationHistory = []

    try {
      // Phase 1: Explore
      this.sendPhaseChange('explore')
      const explorerResult = await runCodeExplorer(repoPath, {
        onWorkerStatus: (worker) => this.sendWorkerStatus(worker),
        onLog: (message, icon) => this.log(message, icon),
      })

      // Phase 2: Engineer
      this.sendPhaseChange('engineer')
      const engineerSession = await runVibeEngineer(
        explorerResult,
        featureRequest,
        {
          onMessage: (msg) => this.sendMessage(msg),
          onLog: (message, icon) => this.log(message, icon),
        },
        () => this.waitForUserInput()
      )

      // Phase 3: Crystallize
      this.sendPhaseChange('crystallize')
      const specPath = join(repoPath, 'SPEC.md')
      const crystallizerResult = await runCrystallizer(
        engineerSession,
        specPath,
        {
          onMessage: (msg) => this.sendMessage(msg),
          onLog: (message, icon) => this.log(message, icon),
        }
      )

      // Complete
      this.sendPhaseChange('complete')
      this.sendPipelineComplete(crystallizerResult.specPath)

      return {
        success: crystallizerResult.success,
        specPath: crystallizerResult.specPath,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.sendError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Handle user message from renderer
   */
  handleUserMessage(message: string): void {
    // Add to conversation history
    this.conversationHistory.push({
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    })

    // Send to UI
    this.mainWindow.webContents.send(IPC_CHANNELS.AGENT_MESSAGE, {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
    })

    // Resolve the pending input promise
    if (this.userInputResolve) {
      this.userInputResolve(message)
      this.userInputResolve = null
    }
  }

  /**
   * Stop the pipeline
   */
  stopPipeline(): void {
    this.isRunning = false
    if (this.userInputResolve) {
      this.userInputResolve('__CANCELLED__')
      this.userInputResolve = null
    }
  }

  /**
   * Wait for user input (used by VibeEngineer)
   */
  private waitForUserInput(): Promise<string> {
    return new Promise((resolve) => {
      this.userInputResolve = resolve
    })
  }

  /**
   * Send a message to the renderer
   */
  private sendMessage(msg: AgentMessage): void {
    this.conversationHistory.push(msg)
    this.mainWindow.webContents.send(IPC_CHANNELS.AGENT_MESSAGE, msg)
  }

  /**
   * Send phase change to renderer
   */
  private sendPhaseChange(phase: Phase): void {
    this.mainWindow.webContents.send(IPC_CHANNELS.PHASE_CHANGE, phase)
  }

  /**
   * Send worker status to renderer
   */
  private sendWorkerStatus(worker: WorkerInfo): void {
    this.mainWindow.webContents.send(IPC_CHANNELS.WORKER_STATUS, worker)
  }

  /**
   * Send error to renderer
   */
  private sendError(error: string): void {
    this.mainWindow.webContents.send(IPC_CHANNELS.AGENT_ERROR, error)
  }

  /**
   * Send pipeline complete to renderer
   */
  private sendPipelineComplete(specPath: string): void {
    this.mainWindow.webContents.send(IPC_CHANNELS.PIPELINE_COMPLETE, specPath)
  }

  /**
   * Log activity (for debugging)
   */
  private log(message: string, icon: string): void {
    console.log(`${icon} ${message}`)
  }
}
