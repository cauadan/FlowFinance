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
          <div className="rounded-3xl border border-emerald-100/80 bg-gradient-to-r from-emerald-50/50 via-[#fafaf5] to-teal-50/40 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#84a98c] text-white shadow-xs">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0c0a09]">{t('analytics.ai_insights_title')}</h3>
                  <p className="text-xs text-[#78716c]">{t('analytics.ai_insights_desc')}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {aiLoading ? (
                [1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl bg-white/70" />
                ))
              ) : aiInsightsData?.insights && aiInsightsData.insights.length > 0 ? (
                aiInsightsData.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-2xl bg-white p-4 shadow-xs border border-[rgba(0,0,0,0.04)]"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          insight.type === 'positive'
                            ? 'bg-emerald-100 text-emerald-800'
                            : insight.type === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          <Lightbulb className="h-2.5 w-2.5" />
                          {insight.tag || 'Dica'}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#0c0a09]">{insight.title}</h4>
                      <p className="text-xs text-[#78716c] leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-4 text-xs text-stone-400">
                  Insights serão gerados automaticamente conforme suas movimentações.
                </div>
              )}
            </div>
          </div>

          {/* Cash Flow History */}
          <Card className="border-[rgba(0,0,0,0.05)] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-[#0c0a09]">{t('analytics.cash_flow_analysis')}</CardTitle>
              <CardDescription className="text-xs text-[#a8a29e]">{t('analytics.income_vs_expense')}</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pl-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflow}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="month" stroke="#a8a29e" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a8a29e" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => formatCurrency(val, currency)} />
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val, currency), '']}
                    contentStyle={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="income" name={t('dashboard.income')} fill="#84a98c" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name={t('dashboard.expense')} fill="#e76f51" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Net Worth Growth */}
            <Card className="border-[rgba(0,0,0,0.05)] bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-[#0c0a09]">{t('analytics.networth_progression')}</CardTitle>
                <CardDescription className="text-xs text-[#a8a29e]">{t('analytics.networth_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] pl-2">
                {networth && networth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={networth}>
                      <defs>
                        <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#84a98c" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#84a98c" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                      <XAxis dataKey="month" stroke="#a8a29e" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#a8a29e" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => formatCurrency(val, currency)} />
                      <Tooltip
                        formatter={(val: number) => [formatCurrency(val, currency), '']}
                        contentStyle={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="networth" name={t('analytics.networth_label')} stroke="#84a98c" strokeWidth={2.5} fillOpacity={1} fill="url(#nwGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Receipt className="h-8 w-8 text-[#a8a29e] mb-2" />
                    <p className="text-sm text-[#a8a29e]">{t('analytics.no_networth')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Expenses Breakdown */}
            <Card className="border-[rgba(0,0,0,0.05)] bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-[#0c0a09]">{t('analytics.expenses_by_category')}</CardTitle>
                <CardDescription className="text-xs text-[#a8a29e]">{t('analytics.category_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex flex-col justify-center">
                {categoriesReport && categoriesReport.length > 0 ? (
                  <div className="relative h-full flex flex-col justify-between">
                    <ResponsiveContainer width="100%" height="70%">
                      <PieChart>
                        <Pie
                          data={categoriesReport}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="total"
                        >
                          {categoriesReport.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: number) => [formatCurrency(val, currency), '']}
                          contentStyle={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Compact List */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] max-h-[90px] overflow-y-auto p-1">
                      {categoriesReport.slice(0, 8).map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-1.5 truncate">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || PIE_COLORS[index % PIE_COLORS.length] }} />
                          <span className="truncate text-stone-600">{entry.name}</span>
                          <span className="font-semibold text-stone-800 ml-auto">{formatCurrency(entry.total, currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Receipt className="h-8 w-8 text-[#a8a29e] mb-2" />
                    <p className="text-sm text-[#a8a29e]">{t('analytics.no_expenses')}</p>
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
