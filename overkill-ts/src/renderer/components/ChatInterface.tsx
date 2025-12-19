import React, { useEffect, useRef } from 'react'
import type { AgentMessage } from '../../shared/types'
import MessageBubble from './MessageBubble'

interface ChatInterfaceProps {
  messages: AgentMessage[]
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div ref={containerRef} style={styles.container}>
      {messages.length === 0 ? (
        <div style={styles.empty}>
          <p>Conversation will appear here...</p>
        </div>
      ) : (
        messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    overflow: 'auto',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#555',
    fontSize: 14,
  },
}

export default ChatInterface
