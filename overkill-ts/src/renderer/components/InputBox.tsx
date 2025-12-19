import React, { useState, useRef, useCallback, KeyboardEvent } from 'react'

interface InputBoxProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

const InputBox: React.FC<InputBoxProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}) => {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (trimmed && !disabled) {
      onSend(trimmed)
      setValue('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }, [value, disabled, onSend])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  return (
    <div style={styles.container}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          ...styles.textarea,
          opacity: disabled ? 0.5 : 1,
        }}
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        style={{
          ...styles.sendButton,
          opacity: disabled || !value.trim() ? 0.5 : 1,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: 12,
    padding: '16px 20px',
    background: '#1a1a1a',
    borderTop: '1px solid #2a2a2a',
  },
  textarea: {
    flex: 1,
    padding: '12px 16px',
    background: '#0f0f0f',
    border: '1px solid #333',
    borderRadius: 12,
    color: '#fff',
    fontSize: 14,
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    minHeight: 44,
    maxHeight: 200,
  },
  sendButton: {
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    flexShrink: 0,
  },
}

export default InputBox
