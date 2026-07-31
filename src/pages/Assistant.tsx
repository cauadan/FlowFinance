import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, User, Sparkles, TrendingUp, PiggyBank, Target, Loader2, AlertCircle } from 'lucide-react'
import { chatWithAssistant } from '@/lib/api'
import { useSettings } from '@/contexts/SettingsContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  { icon: TrendingUp, text: 'How is my month going financially?' },
  { icon: PiggyBank, text: 'Where am I spending the most?' },
  { icon: Target, text: 'Tips to save more money' },
]

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useSettings()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: text.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setError('')
    setIsLoading(true)

    try {
      const history = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const data = await chatWithAssistant(text.trim(), history.slice(0, -1))
      const assistantMessage: Message = { role: 'assistant', content: data.response }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to get response from assistant')
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestion = (text: string) => {
    sendMessage(text)
  }

  const formatContent = (content: string) => {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="rounded bg-black/5 px-1 py-0.5 text-xs">$1</code>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[rgba(0,0,0,0.05)] bg-white/50 px-4 py-4 backdrop-blur-sm lg:px-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#84a98c] to-[#52796f] shadow-md">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0c0a09]">{t('assistant.title')}</h1>
            <p className="text-xs text-[#78716c]">{t('assistant.subtitle')}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-700">Gemini AI</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-0">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-full flex-col items-center justify-center gap-6"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#84a98c]/20 to-[#52796f]/10">
              <Sparkles className="h-8 w-8 text-[#84a98c]" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-[#0c0a09]">{t('assistant.welcome')}</h2>
              <p className="mt-1 max-w-md text-sm text-[#78716c]">
                {t('assistant.welcome_desc')}
              </p>
            </div>
            <div className="grid w-full max-w-lg gap-2">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (i + 1) }}
                  onClick={() => handleSuggestion(s.text)}
                  className="group flex items-center gap-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white px-4 py-3 text-left text-sm text-[#44403c] shadow-sm transition-all hover:border-[#84a98c]/30 hover:bg-[#84a98c]/5 hover:shadow-md"
                >
                  <s.icon className="h-4 w-4 flex-shrink-0 text-[#84a98c]" />
                  <span>{s.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-[#2f3e46]'
                      : 'bg-gradient-to-br from-[#84a98c] to-[#52796f]'
                  }`}>
                    {msg.role === 'user'
                      ? <User className="h-4 w-4 text-white" />
                      : <Bot className="h-4 w-4 text-white" />
                    }
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#2f3e46] text-white rounded-tr-md'
                      : 'bg-white text-[#0c0a09] shadow-sm border border-[rgba(0,0,0,0.05)] rounded-tl-md'
                  }`}>
                    <div dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#84a98c] to-[#52796f]">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-[rgba(0,0,0,0.05)] bg-white px-4 py-3 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-[#84a98c]" />
                  <span className="text-sm text-[#78716c]">{t('assistant.thinking')}</span>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-[rgba(0,0,0,0.05)] bg-white/80 px-4 py-4 backdrop-blur-sm lg:px-0">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('assistant.placeholder')}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white px-4 py-2.5 text-sm text-[#0c0a09] placeholder:text-[#a8a29e] transition-all focus:border-[#84a98c] focus:outline-none focus:ring-2 focus:ring-[#84a98c]/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#84a98c] text-white shadow-sm transition-all hover:bg-[#52796f] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[10px] text-[#a8a29e]">
          {t('assistant.disclaimer')}
        </p>
      </div>
    </div>
  )
}
