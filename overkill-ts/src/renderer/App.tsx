import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { AgentMessage, WorkerInfo, Phase } from '../shared/types'
import ChatInterface from './components/ChatInterface'
import WorkerSidebar from './components/WorkerSidebar'
import InputBox from './components/InputBox'

const App: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('idle')
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [workers, setWorkers] = useState<Map<string, WorkerInfo>>(new Map())
  const [repoPath, setRepoPath] = useState<string>('')
  const [featureRequest, setFeatureRequest] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [specPath, setSpecPath] = useState<string | null>(null)

  // Setup IPC listeners
  useEffect(() => {
    const unsubMessage = window.electronAPI.onAgentMessage((msg) => {
      setMessages((prev) => [...prev, msg])
    })

    const unsubWorker = window.electronAPI.onWorkerStatus((worker) => {
      setWorkers((prev) => new Map(prev).set(worker.id, worker))
    })

    const unsubPhase = window.electronAPI.onPhaseChange((newPhase) => {
      setPhase(newPhase)
    })

    const unsubError = window.electronAPI.onError((err) => {
      setError(err)
      setIsRunning(false)
    })

    const unsubComplete = window.electronAPI.onPipelineComplete((path) => {
      setSpecPath(path)
      setIsRunning(false)
    })

    return () => {
      unsubMessage()
      unsubWorker()
      unsubPhase()
      unsubError()
      unsubComplete()
    }
  }, [])

  const handlePickDirectory = async () => {
    const path = await window.electronAPI.pickDirectory()
    if (path) {
      setRepoPath(path)
    }
  }

  const handleStart = async () => {
    if (!repoPath || !featureRequest) return

    setIsRunning(true)
    setError(null)
    setSpecPath(null)
    setMessages([])
    setWorkers(new Map())

    await window.electronAPI.startPipeline(repoPath, featureRequest)
  }

  const handleSendMessage = async (message: string) => {
    await window.electronAPI.sendMessage(message)
  }

  const handleStop = async () => {
    await window.electronAPI.stopPipeline()
    setIsRunning(false)
  }

  const phaseLabels: Record<Phase, string> = {
    idle: 'Ready',
    explore: '🔍 Exploring',
    engineer: '🤖 Engineering',
    crystallize: '📝 Crystallizing',
    complete: '✅ Complete',
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Overkill</h1>
          <span style={styles.phase}>{phaseLabels[phase]}</span>
        </div>
        {isRunning && (
          <button onClick={handleStop} style={styles.stopButton}>
            Stop
          </button>
        )}
      </header>

      {/* Main content */}
      <div style={styles.main}>
        {/* Sidebar */}
        <WorkerSidebar workers={workers} phase={phase} />

        {/* Chat area */}
        <div style={styles.chatArea}>
          {phase === 'idle' ? (
            <div style={styles.setupPanel}>
              <h2 style={styles.setupTitle}>New Specification</h2>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Repository</label>
                <div style={styles.pathInput}>
                  <input
                    type="text"
                    value={repoPath}
                    onChange={(e) => setRepoPath(e.target.value)}
                    placeholder="/path/to/repository"
                    style={styles.textInput}
                  />
                  <button onClick={handlePickDirectory} style={styles.browseButton}>
                    Browse
                  </button>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Feature Request</label>
                <textarea
                  value={featureRequest}
                  onChange={(e) => setFeatureRequest(e.target.value)}
                  placeholder="Describe the feature you want to spec..."
                  style={styles.textarea}
                  rows={4}
                />
              </div>

              <button
                onClick={handleStart}
                disabled={!repoPath || !featureRequest}
                style={{
                  ...styles.startButton,
                  opacity: !repoPath || !featureRequest ? 0.5 : 1,
                }}
              >
                Start Specification
              </button>

              {error && <div style={styles.error}>{error}</div>}
            </div>
          ) : (
            <>
              <ChatInterface messages={messages} />
              <InputBox
                onSend={handleSendMessage}
                disabled={phase === 'explore' || phase === 'crystallize' || phase === 'complete'}
                placeholder={
                  phase === 'engineer'
                    ? 'Type your response or "done" to finish...'
                    : 'Waiting...'
                }
              />
              {specPath && (
                <div style={styles.successBanner}>
                  ✅ Specification saved to: <code>{specPath}</code>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Type for Electron-specific CSS properties
type ElectronCSSProperties = React.CSSProperties & {
  WebkitAppRegion?: 'drag' | 'no-drag'
}

const styles: Record<string, ElectronCSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0f0f0f',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    background: '#1a1a1a',
    borderBottom: '1px solid #2a2a2a',
    WebkitAppRegion: 'drag',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#fff',
  },
  phase: {
    fontSize: 14,
    color: '#888',
    padding: '4px 12px',
    background: '#252525',
    borderRadius: 12,
  },
  stopButton: {
    padding: '6px 16px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    WebkitAppRegion: 'no-drag',
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  setupPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    maxWidth: 600,
    margin: '60px auto',
    padding: 40,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 600,
    color: '#fff',
    marginBottom: 10,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: '#888',
  },
  pathInput: {
    display: 'flex',
    gap: 8,
  },
  textInput: {
    flex: 1,
    padding: '10px 14px',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
  },
  browseButton: {
    padding: '10px 20px',
    background: '#2a2a2a',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: 8,
    cursor: 'pointer',
  },
  textarea: {
    padding: '10px 14px',
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
  },
  startButton: {
    padding: '12px 24px',
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 10,
  },
  error: {
    padding: 12,
    background: '#7f1d1d',
    color: '#fca5a5',
    borderRadius: 8,
    fontSize: 14,
  },
  successBanner: {
    padding: '12px 20px',
    background: '#14532d',
    color: '#86efac',
    borderTop: '1px solid #166534',
    fontSize: 14,
  },
}

export default App
