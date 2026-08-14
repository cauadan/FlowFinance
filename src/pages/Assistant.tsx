import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, User, Sparkles, TrendingUp, PiggyBank, Target, Loader2, AlertCircle } from 'lucide-react'
import { chatWithAssistant } from '@/lib/api'
import { useSettings } from '@/contexts/SettingsContext'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Assistant() {
  const queryClient = useQueryClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t } = useSettings()

  const SUGGESTIONS = [
    { icon: TrendingUp, text: t('assistant.sug_month') },
    { icon: PiggyBank, text: t('assistant.sug_spending') },
    { icon: Target, text: t('assistant.sug_tips') },
  ]

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

      if (data.transactionCreated) {
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        queryClient.invalidateQueries({ queryKey: ['report'] })
        queryClient.invalidateQueries({ queryKey: ['recurring-suggestions'] })
        toast.success(t('tx.created'))
      }
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
    <div className="flex h-[calc(100vh-5.5rem)] flex-col gap-3 sm:gap-4 max-w-5xl mx-auto">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/80 dark:bg-card/40 p-4 sm:p-5 shadow-xs backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#84a98c] to-[#52796f] text-white shadow-sm ring-1 ring-white/10">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">{t('assistant.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('assistant.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-2xs">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span>Gemini AI</span>
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto rounded-2xl sm:rounded-3xl border border-border/70 bg-card/40 dark:bg-card/20 p-4 sm:p-6 backdrop-blur-xs shadow-xs">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-full flex-col items-center justify-center gap-6 py-6"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#84a98c]/20 to-[#52796f]/10 text-[#84a98c] ring-1 ring-[#84a98c]/30 shadow-xs">
              <Sparkles className="h-8 w-8 text-[#84a98c]" />
            </div>
            <div className="text-center max-w-md space-y-1">
              <h2 className="text-lg font-bold text-foreground">{t('assistant.welcome')}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t('assistant.welcome_desc')}
              </p>
            </div>
            <div className="grid w-full max-w-lg gap-2.5">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * (i + 1) }}
                  onClick={() => handleSuggestion(s.text)}
                  className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-card/80 dark:bg-card/60 px-4 py-3 text-left text-xs sm:text-sm text-foreground shadow-2xs transition-all duration-200 hover:border-[#84a98c]/50 hover:bg-[#84a98c]/10 hover:shadow-xs hover:translate-y-[-1px]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#84a98c]/15 text-[#84a98c]">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{s.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-[#2f3e46] text-white dark:bg-[#354f52]'
                      : 'bg-gradient-to-br from-[#84a98c] to-[#52796f] text-white'
                  }`}>
                    {msg.role === 'user'
                      ? <User className="h-4 w-4 text-white" />
                      : <Bot className="h-4 w-4 text-white" />
                    }
                  </div>
                  <div className={`max-w-[82%] rounded-2xl px-4.5 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-[#84a98c] text-white rounded-tr-xs'
                      : 'bg-card text-foreground border border-border rounded-tl-xs dark:bg-[#161922]'
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
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#84a98c] to-[#52796f] text-white shadow-xs">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-xs border border-border bg-card dark:bg-[#161922] px-4 py-3 shadow-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-[#84a98c]" />
                  <span className="text-xs sm:text-sm text-muted-foreground">{t('assistant.thinking')}</span>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs sm:text-sm text-red-600 dark:text-red-400"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area Card */}
      <div className="flex-shrink-0 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/80 dark:bg-card/40 p-3 sm:p-4 backdrop-blur-md shadow-xs">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('assistant.placeholder')}
            disabled={isLoading}
            className="flex-1 rounded-xl sm:rounded-2xl border border-border bg-card dark:bg-[#1b1f27] px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-[#84a98c] focus:outline-none focus:ring-2 focus:ring-[#84a98c]/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-[#84a98c] text-white shadow-sm transition-all hover:bg-[#52796f] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted-foreground">
          {t('assistant.disclaimer')}
        </p>
      </div>
    </div>
  )
}
