import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Sparkles,
  Lightbulb,
} from 'lucide-react'
import {
  getCashflowReport,
  getCategoriesReport,
  getNetworthReport,
  getAiInsights,
} from '@/lib/api'
import { useSettings } from '@/contexts/SettingsContext'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

export default function Analytics() {
  // Pre-selection dates helper
  const getPreselectedDates = (range: string) => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    let fromStr = ''

    if (range === '30days') {
      const past = new Date()
      past.setDate(today.getDate() - 30)
      fromStr = past.toISOString().split('T')[0]
    } else if (range === '6months') {
      const past = new Date(today.getFullYear(), today.getMonth() - 5, 1)
      fromStr = past.toISOString().split('T')[0]
    } else if (range === 'thisyear') {
      fromStr = `${today.getFullYear()}-01-01`
    }

    return { from: fromStr, to: todayStr }
  }

  const [dateRange, setDateRange] = useState<'30days' | '6months' | 'thisyear' | 'all'>('6months')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const activeDates = dateRange === 'all'
    ? { from: '', to: '' }
    : getPreselectedDates(dateRange)

  const fromParam = dateRange === 'all' ? customFrom : activeDates.from
  const toParam = dateRange === 'all' ? customTo : activeDates.to

  // Queries
  const { t, currency } = useSettings()

  const translateDbItem = (name: string, type: 'category' | 'payment') => {
    if (!name) return ''
    const key = `${type}.${name.toLowerCase().trim()}`
    const translated = t(key)
    return translated !== key ? translated : name
  }

  const { data: cashflow, isLoading: cfLoading } = useQuery({
    queryKey: ['report', 'cashflow', fromParam, toParam],
    queryFn: () => getCashflowReport({ from: fromParam || undefined, to: toParam || undefined }),
  })

  const { data: categoriesReport, isLoading: catLoading } = useQuery({
    queryKey: ['report', 'categories', fromParam, toParam],
    queryFn: () => getCategoriesReport({ from: fromParam || undefined, to: toParam || undefined, type: 'EXPENSE' }),
  })

  const { data: networth, isLoading: nwLoading } = useQuery({
    queryKey: ['report', 'networth'],
    queryFn: getNetworthReport,
  })

  const { data: aiInsightsData, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: getAiInsights,
  })

  const isLoading = cfLoading || catLoading || nwLoading

  // Calculate overall metrics from cashflow report
  const totalIncome = cashflow?.reduce((sum, item) => sum + item.income, 0) || 0
  const totalExpense = cashflow?.reduce((sum, item) => sum + item.expense, 0) || 0
  const netSavings = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

  const PIE_COLORS = ['#84a98c', '#52796f', '#354f52', '#2f3e46', '#cad2c5', '#a8a29e', '#e76f51', '#f4a261', '#e9c46a']

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#0c0a09]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('analytics.title')}
          </h1>
          <p className="text-sm text-[#78716c]">
            {t('analytics.subtitle')}
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex bg-[#f5f5f0] border border-[rgba(0,0,0,0.05)] rounded-lg p-1">
            <button
              onClick={() => setDateRange('30days')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                dateRange === '30days' ? 'bg-white shadow-sm text-stone-850' : 'text-stone-500'
              }`}
            >
              {t('analytics.30days')}
            </button>
            <button
              onClick={() => setDateRange('6months')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                dateRange === '6months' ? 'bg-white shadow-sm text-stone-850' : 'text-stone-500'
              }`}
            >
              {t('analytics.6months')}
            </button>
            <button
              onClick={() => setDateRange('thisyear')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                dateRange === 'thisyear' ? 'bg-white shadow-sm text-stone-850' : 'text-stone-500'
              }`}
            >
              {t('analytics.thisyear')}
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                dateRange === 'all' ? 'bg-white shadow-sm text-stone-850' : 'text-stone-500'
              }`}
            >
              {t('analytics.custom')}
            </button>
          </div>

          {dateRange === 'all' && (
            <div className="flex items-center gap-1 text-xs ml-2">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 w-[120px] py-1 border-[rgba(0,0,0,0.08)] bg-white text-[11px]"
              />
              <span>{t('analytics.to')}</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 w-[120px] py-1 border-[rgba(0,0,0,0.08)] bg-white text-[11px]"
              />
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[350px] rounded-xl" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[350px] rounded-xl" />
            <Skeleton className="h-[350px] rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Overview Metrics Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-[rgba(0,0,0,0.05)] bg-white shadow-sm">
              <CardHeader className="pb-1 space-y-0.5">
                <CardDescription className="text-[10px] font-semibold uppercase tracking-wider text-[#78716c]">
                  {t('analytics.total_income')}
                </CardDescription>
                <div className="flex items-center gap-1 text-[#84a98c]">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-2xl font-bold">{formatCurrency(totalIncome, currency)}</span>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-[rgba(0,0,0,0.05)] bg-white shadow-sm">
              <CardHeader className="pb-1 space-y-0.5">
                <CardDescription className="text-[10px] font-semibold uppercase tracking-wider text-[#78716c]">
                  {t('analytics.total_expenses')}
                </CardDescription>
                <div className="flex items-center gap-1 text-[#e76f51]">
                  <ArrowDownRight className="h-3 w-3" />
                  <span className="text-2xl font-bold">{formatCurrency(totalExpense, currency)}</span>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-[rgba(0,0,0,0.05)] bg-white shadow-sm">
              <CardHeader className="pb-1 space-y-0.5">
                <CardDescription className="text-[10px] font-semibold uppercase tracking-wider text-[#78716c]">
                  {t('analytics.net_savings')}
                </CardDescription>
                <div className={`flex items-center gap-1 ${netSavings >= 0 ? 'text-[#84a98c]' : 'text-[#e76f51]'}`}>
                  {netSavings >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span className="text-2xl font-bold">{formatCurrency(netSavings, currency)}</span>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-[rgba(0,0,0,0.05)] bg-white shadow-sm">
              <CardHeader className="pb-1 space-y-0.5">
                <CardDescription className="text-[10px] font-semibold uppercase tracking-wider text-[#78716c]">
                  {t('analytics.savings_rate')}
                </CardDescription>
                <div className="text-2xl font-bold text-[#0c0a09]">
                  {formatPercentage(savingsRate)}
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* AI Insights & Financial Tips Section */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-linear-to-br from-emerald-500/5 via-card to-teal-500/5 p-6 shadow-sm dark:border-emerald-500/20 dark:from-[#171b24] dark:to-[#12151c] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#84a98c]/15 text-[#84a98c] ring-1 ring-[#84a98c]/30 shadow-xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#84a98c]">✦ FlowFinance Intelligence</span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{t('analytics.ai_insights_title')}</h3>
                  <p className="text-xs text-muted-foreground">{t('analytics.ai_insights_desc')}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-3">
              {aiLoading ? (
                [1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl bg-card" />
                ))
              ) : aiInsightsData?.insights && aiInsightsData.insights.length > 0 ? (
                aiInsightsData.insights.map((insight, idx) => {
                  const isPositive = insight.type === 'positive'
                  const isWarning = insight.type === 'warning'
                  return (
                    <div
                      key={idx}
                      className={`group relative flex flex-col justify-between rounded-2xl p-4.5 transition-all duration-200 hover:scale-[1.01] hover:shadow-md border ${
                        isPositive
                          ? 'bg-card border-emerald-500/20 dark:bg-[#181c25] dark:border-emerald-500/25 hover:border-emerald-500/40'
                          : isWarning
                          ? 'bg-card border-amber-500/20 dark:bg-[#181c25] dark:border-amber-500/25 hover:border-amber-500/40'
                          : 'bg-card border-blue-500/20 dark:bg-[#181c25] dark:border-blue-500/25 hover:border-blue-500/40'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border ${
                            isPositive
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                              : isWarning
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                          }`}>
                            <Lightbulb className="h-3 w-3" />
                            {insight.tag || 'Dica'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-foreground tracking-tight">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-3 text-center py-6 text-xs text-muted-foreground">
                  Insights serão gerados automaticamente conforme suas movimentações.
                </div>
              )}
            </div>
          </div>

          {/* Cash Flow History */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">{t('analytics.cash_flow_analysis')}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">{t('analytics.income_vs_expense')}</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pl-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflow}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => formatCurrency(val, currency)} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5">
                            <p className="font-semibold text-foreground">{label}</p>
                            {payload.map((entry, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                  {entry.name}
                                </span>
                                <span className="font-semibold text-foreground">
                                  {formatCurrency(Number(entry.value), currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="income" name={t('dashboard.income')} fill="#84a98c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name={t('dashboard.expense')} fill="#e76f51" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Net Worth Growth */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">{t('analytics.networth_progression')}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">{t('analytics.networth_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] pl-2">
                {networth && networth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={networth}>
                      <defs>
                        <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#84a98c" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#84a98c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => formatCurrency(val, currency)} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
                                <p className="text-muted-foreground">{label}</p>
                                <p className="font-bold text-base text-[#84a98c]">
                                  {formatCurrency(Number(payload[0].value), currency)}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Area type="monotone" dataKey="networth" name={t('analytics.networth_label')} stroke="#84a98c" strokeWidth={2.5} fillOpacity={1} fill="url(#nwGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Receipt className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">{t('analytics.no_networth')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Expenses Breakdown */}
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">{t('analytics.expenses_by_category')}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">{t('analytics.category_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex flex-col justify-center">
                {categoriesReport && categoriesReport.length > 0 ? (
                  <div className="relative h-full flex flex-col justify-between">
                    <div className="relative h-[65%] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoriesReport}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="total"
                            stroke="hsl(var(--card))"
                            strokeWidth={2}
                          >
                            {categoriesReport.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                const total = categoriesReport.reduce((acc, c) => acc + c.total, 0)
                                const percent = total > 0 ? ((data.total / total) * 100).toFixed(1) : '0'
                                return (
                                  <div className="rounded-xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: data.color || '#84a98c' }} />
                                      <span className="font-semibold text-foreground">{translateDbItem(data.name, 'category')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 font-bold text-foreground">
                                      <span>{formatCurrency(data.total, currency)}</span>
                                      <span className="text-muted-foreground text-[11px]">({percent}%)</span>
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center Total Stat */}
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Total</span>
                        <span className="text-xs font-bold text-foreground">
                          {formatCurrency(categoriesReport.reduce((acc, c) => acc + c.total, 0), currency)}
                        </span>
                      </div>
                    </div>

                    {/* Compact List */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] max-h-[95px] overflow-y-auto px-2 pb-1">
                      {categoriesReport.slice(0, 8).map((entry, index) => {
                        const total = categoriesReport.reduce((acc, c) => acc + c.total, 0)
                        const pct = total > 0 ? Math.round((entry.total / total) * 100) : 0
                        return (
                          <div key={entry.name} className="flex items-center justify-between rounded-lg bg-secondary/40 px-2 py-1 gap-1.5 border border-border/50">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || PIE_COLORS[index % PIE_COLORS.length] }} />
                              <span className="truncate text-muted-foreground font-medium">{translateDbItem(entry.name, 'category')}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="font-semibold text-foreground">{formatCurrency(entry.total, currency)}</span>
                              <span className="text-[9px] text-muted-foreground">({pct}%)</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Receipt className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">{t('analytics.no_expenses')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </motion.div>
  )
}
