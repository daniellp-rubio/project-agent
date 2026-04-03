'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Bot, X, Minimize2 } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { cn } from '@/lib/utils/cn'
import type { WidgetConfig } from '@/lib/supabase/types'

type Props = {
  agentId: string
  config: WidgetConfig
  standalone?: boolean
}

export default function ChatWidget({ agentId, config, standalone = false }: Props) {
  const [isOpen, setIsOpen] = useState(standalone)
  const [input, setInput] = useState('')
  const { messages, isLoading, error, sendMessage } = useChat(agentId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen && !standalone) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, standalone])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    const text = input
    setInput('')
    await sendMessage(text)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  const ChatWindow = (
    <div
      className={cn(
        'bg-white flex flex-col shadow-2xl',
        standalone
          ? 'w-full h-full'
          : 'fixed w-[380px] h-[580px] rounded-2xl overflow-hidden border border-slate-200'
      )}
      style={standalone ? {} : {
        bottom: '84px',
        [config.position === 'bottom-right' ? 'right' : 'left']: '20px',
        zIndex: 9999,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 shrink-0"
        style={{ backgroundColor: config.primaryColor }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{config.agentName}</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              <span className="text-white/70 text-xs">En línea</span>
            </div>
          </div>
        </div>
        {!standalone && (
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Mensaje de bienvenida */}
        <div className="flex gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: `${config.primaryColor}20` }}
          >
            <Bot className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
          </div>
          <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[80%]">
            <p className="text-sm text-slate-800 leading-relaxed">{config.welcomeMessage}</p>
          </div>
        </div>

        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2.5',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'assistant' && (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${config.primaryColor}20` }}
              >
                <Bot className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
              </div>
            )}
            <div
              className={cn(
                'rounded-2xl px-3.5 py-2.5 max-w-[80%] text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'rounded-tr-sm text-white'
                  : 'bg-slate-100 text-slate-800 rounded-tl-sm',
                msg.isStreaming && 'opacity-80'
              )}
              style={msg.role === 'user' ? { backgroundColor: config.primaryColor } : {}}
            >
              {msg.content || (msg.isStreaming ? <TypingDots /> : null)}
            </div>
          </div>
        ))}

        {error && (
          <div className="text-center">
            <span className="text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-full">{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="border-t border-slate-100 px-3 py-3 flex items-center gap-2 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={config.placeholder}
          disabled={isLoading}
          className="flex-1 text-sm px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50"
          style={{ '--tw-ring-color': config.primaryColor } as React.CSSProperties}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-opacity disabled:opacity-30"
          style={{ backgroundColor: config.primaryColor }}
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </form>

      {config.showBranding && (
        <div className="text-center pb-2">
          <span className="text-xs text-slate-300">Powered by AgentHub</span>
        </div>
      )}
    </div>
  )

  if (standalone) return ChatWindow

  return (
    <>
      {isOpen && ChatWindow}

      {/* FAB button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{
          backgroundColor: config.primaryColor,
          bottom: '20px',
          [config.position === 'bottom-right' ? 'right' : 'left']: '20px',
          zIndex: 9999,
        }}
      >
        {isOpen ? (
          <Minimize2 className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-6 h-6 text-white" />
        )}
      </button>
    </>
  )
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  )
}
