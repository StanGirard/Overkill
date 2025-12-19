import React from 'react'
import ReactMarkdown from 'react-markdown'
import type { AgentMessage } from '../../shared/types'

interface MessageBubbleProps {
  message: AgentMessage
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAgent = message.role === 'agent'

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      style={{
        ...styles.container,
        alignSelf: isAgent ? 'flex-start' : 'flex-end',
      }}
    >
      <div
        style={{
          ...styles.bubble,
          background: isAgent ? '#1a1a1a' : '#4f46e5',
          borderColor: isAgent ? '#2a2a2a' : '#4338ca',
        }}
      >
        <div style={styles.content}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p style={styles.paragraph}>{children}</p>,
              strong: ({ children }) => <strong style={styles.strong}>{children}</strong>,
              code: ({ children, className }) => {
                const isInline = !className
                return isInline ? (
                  <code style={styles.inlineCode}>{children}</code>
                ) : (
                  <code style={styles.blockCode}>{children}</code>
                )
              },
              pre: ({ children }) => <pre style={styles.pre}>{children}</pre>,
              ul: ({ children }) => <ul style={styles.list}>{children}</ul>,
              ol: ({ children }) => <ol style={styles.list}>{children}</ol>,
              li: ({ children }) => <li style={styles.listItem}>{children}</li>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
      <span style={styles.timestamp}>{formatTime(message.timestamp)}</span>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '80%',
    gap: 4,
  },
  bubble: {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid',
  },
  content: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#e5e5e5',
  },
  paragraph: {
    margin: '0 0 12px 0',
  },
  strong: {
    color: '#fff',
    fontWeight: 600,
  },
  inlineCode: {
    background: '#2a2a2a',
    padding: '2px 6px',
    borderRadius: 4,
    fontFamily: 'ui-monospace, monospace',
    fontSize: 13,
  },
  blockCode: {
    display: 'block',
    background: '#0a0a0a',
    padding: 12,
    borderRadius: 6,
    fontFamily: 'ui-monospace, monospace',
    fontSize: 13,
    overflow: 'auto',
  },
  pre: {
    margin: '12px 0',
  },
  list: {
    margin: '12px 0',
    paddingLeft: 24,
  },
  listItem: {
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#555',
    alignSelf: 'flex-end',
  },
}

export default MessageBubble
