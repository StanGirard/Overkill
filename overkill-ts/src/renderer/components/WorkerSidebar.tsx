import React, { useRef, useEffect } from 'react'
import type { WorkerInfo, Phase, LogEntry } from '../../shared/types'

interface WorkerSidebarProps {
  workers: Map<string, WorkerInfo>
  phase: Phase
  logs: LogEntry[]
}

const WorkerSidebar: React.FC<WorkerSidebarProps> = ({ workers, phase, logs }) => {
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const workerTypeLabels: Record<WorkerInfo['type'], { icon: string; label: string }> = {
    'code-explorer': { icon: '🔍', label: 'Code Explorer' },
    'researcher': { icon: '🌐', label: 'Researcher' },
    'dependency-checker': { icon: '📦', label: 'Dependencies' },
    'pattern-matcher': { icon: '🎯', label: 'Patterns' },
  }

  const statusIcons: Record<WorkerInfo['status'], string> = {
    idle: '⏸️',
    running: '⏳',
    completed: '✅',
    error: '❌',
  }

  const phaseSteps: { phase: Phase; label: string; icon: string }[] = [
    { phase: 'explore', label: 'Explore', icon: '🔍' },
    { phase: 'engineer', label: 'Engineer', icon: '🤖' },
    { phase: 'crystallize', label: 'Crystallize', icon: '📝' },
  ]

  const getPhaseStatus = (stepPhase: Phase): 'completed' | 'active' | 'pending' => {
    const order = ['idle', 'explore', 'engineer', 'crystallize', 'complete']
    const currentIndex = order.indexOf(phase)
    const stepIndex = order.indexOf(stepPhase)

    if (phase === 'complete') return 'completed'
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <aside style={styles.sidebar}>
      {/* Phase Progress */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Progress</h3>
        <div style={styles.phases}>
          {phaseSteps.map((step, index) => {
            const status = getPhaseStatus(step.phase)
            return (
              <div key={step.phase} style={styles.phaseItem}>
                <div
                  style={{
                    ...styles.phaseIcon,
                    background:
                      status === 'completed'
                        ? '#166534'
                        : status === 'active'
                          ? '#4f46e5'
                          : '#2a2a2a',
                    borderColor:
                      status === 'completed'
                        ? '#22c55e'
                        : status === 'active'
                          ? '#6366f1'
                          : '#333',
                  }}
                >
                  {status === 'completed' ? '✓' : step.icon}
                </div>
                <span
                  style={{
                    ...styles.phaseLabel,
                    color: status === 'pending' ? '#555' : '#e5e5e5',
                  }}
                >
                  {step.label}
                </span>
                {index < phaseSteps.length - 1 && (
                  <div
                    style={{
                      ...styles.phaseLine,
                      background: status === 'completed' ? '#22c55e' : '#333',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Activity Logs */}
      {logs.length > 0 && (
        <div style={styles.logsSection}>
          <h3 style={styles.sectionTitle}>Activity</h3>
          <div style={styles.logsContainer}>
            {logs.map((log) => (
              <div key={log.id} style={styles.logItem}>
                <span style={styles.logIcon}>{log.icon}</span>
                <span style={styles.logMessage}>{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Workers */}
      {workers.size > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Workers</h3>
          <div style={styles.workers}>
            {Array.from(workers.values()).map((worker) => {
              const { icon, label } = workerTypeLabels[worker.type]
              return (
                <div key={worker.id} style={styles.workerItem}>
                  <div style={styles.workerHeader}>
                    <span style={styles.workerIcon}>{icon}</span>
                    <span style={styles.workerLabel}>{label}</span>
                    <span style={styles.workerStatus}>{statusIcons[worker.status]}</span>
                  </div>
                  {worker.progress && (
                    <p style={styles.workerProgress}>{worker.progress}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </aside>
  )
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 280,
    background: '#141414',
    borderRight: '1px solid #2a2a2a',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflow: 'hidden',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    flexShrink: 0,
  },
  logsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  phases: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  phaseItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  phaseIcon: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    border: '1px solid',
    fontSize: 12,
    flexShrink: 0,
  },
  phaseLabel: {
    fontSize: 13,
    fontWeight: 500,
  },
  phaseLine: {
    position: 'absolute',
    left: 13,
    top: 32,
    width: 2,
    height: 16,
    borderRadius: 1,
  },
  logsContainer: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    paddingRight: 4,
  },
  logItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '4px 0',
  },
  logIcon: {
    fontSize: 12,
    flexShrink: 0,
    width: 16,
    textAlign: 'center',
  },
  logMessage: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
  workers: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  workerItem: {
    padding: 10,
    background: '#1a1a1a',
    borderRadius: 8,
    border: '1px solid #2a2a2a',
  },
  workerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  workerIcon: {
    fontSize: 14,
  },
  workerLabel: {
    flex: 1,
    fontSize: 13,
    color: '#e5e5e5',
  },
  workerStatus: {
    fontSize: 12,
  },
  workerProgress: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
  },
}

export default WorkerSidebar
