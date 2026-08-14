import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router'
import {
  ArrowRight,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from 'lucide-react'
import {
  getDashboardSummary,
  getDashboardCharts,
  getRecentTransactions,
} from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { useSettings } from '@/contexts/SettingsContext'

export default function Dashboard() {
  const { t, currency } = useSettings()

  const translateDbItem = (name: string, type: 'category' | 'payment') => {
    if (!name) return ''
    const key = `${type}.${name.toLowerCase().trim()}`
    const translated = t(key)
    return translated !== key ? translated : name
  }

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary,
  })

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: getDashboardCharts,
  })

  const { data: recent, isLoading: recentLoading } = useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: getRecentTransactions,
  })

  const isLoading = summaryLoading || chartsLoading || recentLoading

  // KPI cards definition (Entradas totais, Despesas totais, Saldo líquido)
  const isPositiveNet = summary ? summary.monthlySavings >= 0 : true
  const cards = [
    {
      title: t('dashboard.total_income'),
      value: summary ? formatCurrency(summary.monthlyIncome, currency) : '$0.00',
      description: t('dashboard.total_income_desc'),
      icon: ArrowUpRight,
      color: 'text-[#84a98c]',
      bgColor: 'bg-[#84a98c]/10',
    },
    {
      title: t('dashboard.total_expenses'),
      value: summary ? formatCurrency(summary.monthlyExpense, currency) : '$0.00',
      description: t('dashboard.total_expenses_desc'),
      icon: ArrowDownRight,
      color: 'text-[#e76f51]',
      bgColor: 'bg-[#e76f51]/10',
    },
    {
      title: t('dashboard.net_balance'),
      value: summary ? formatCurrency(summary.monthlySavings, currency) : '$0.00',
      description: t('dashboard.net_balance_desc'),
      icon: Wallet,
      color: isPositiveNet ? 'text-[#84a98c]' : 'text-[#e76f51]',
      bgColor: isPositiveNet ? 'bg-[#84a98c]/10' : 'bg-[#e76f51]/10',
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[350px] rounded-xl" />
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[350px] md:col-span-2 rounded-xl" />
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          {t('dashboard.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card, idx) => {
          const Icon = card.icon
          return (
            <Card key={idx} className="border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#84a98c]/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${card.bgColor} ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cash Flow Chart */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">{t('dashboard.cash_flow')}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{t('dashboard.compare_income_expense')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pl-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.cashFlow}>
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

        {/* Weekly Trend */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">{t('dashboard.weekly_trend')}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{t('dashboard.trend_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pl-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.weeklyTrend}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84a98c" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#84a98c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e76f51" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#e76f51" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => val.slice(5)} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => formatCurrency(val, currency)} />
                <Tooltip
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
                <Area type="monotone" dataKey="income" name={t('dashboard.income')} stroke="#84a98c" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expense" name={t('dashboard.expense')} stroke="#e76f51" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Transactions */}
        <Card className="border-border bg-card shadow-sm md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">{t('dashboard.recent_transactions')}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">{t('dashboard.recent_desc')}</CardDescription>
            </div>
            <Link to="/transactions" className="flex items-center gap-1 text-xs font-semibold text-[#84a98c] hover:underline">
              {t('dashboard.view_all')}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            {recent && recent.length > 0 ? (
              <div className="divide-y divide-border px-6">
                {recent.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-xs"
                        style={{ backgroundColor: `${tx.category?.color || '#cad2c5'}22`, color: tx.category?.color || '#a8a29e' }}
                      >
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">{tx.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{tx.category?.name ? translateDbItem(tx.category.name, 'category') : t('transactions.uncategorized')}</span>
                          <span>•</span>
                          <span>{formatDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${tx.type === 'INCOME' ? 'text-[#84a98c]' : 'text-[#e76f51]'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{t('dashboard.no_transactions')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown Donut */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">{t('dashboard.top_categories')}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{t('dashboard.categories_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-[300px]">
            {charts && charts.categoryBreakdown && charts.categoryBreakdown.length > 0 ? (
              <div className="relative h-full flex flex-col justify-between">
                <div className="relative h-[65%] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="total"
                        stroke="hsl(var(--card))"
                        strokeWidth={2}
                      >
                        {charts.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#a8a29e'} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            const total = charts.categoryBreakdown.reduce((acc, c) => acc + c.total, 0)
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
                      {formatCurrency(charts.categoryBreakdown.reduce((acc, c) => acc + c.total, 0), currency)}
                    </span>
                  </div>
                </div>

                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-2 text-[10px] px-2 pb-1">
                  {charts.categoryBreakdown.slice(0, 4).map((entry) => {
                    const total = charts.categoryBreakdown.reduce((acc, c) => acc + c.total, 0)
                    const pct = total > 0 ? Math.round((entry.total / total) * 100) : 0
                    return (
                      <div key={entry.name} className="flex items-center justify-between rounded-lg bg-secondary/40 px-2 py-1 gap-1.5 border border-border/50">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || '#a8a29e' }} />
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{t('dashboard.no_data')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
