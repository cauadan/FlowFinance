import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Star,
  StarOff,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Repeat,
  Sparkles,
  Check,
  X,
} from 'lucide-react'
import {
  getTransactions,
  getCategories,
  getPaymentMethods,
  deleteTransaction,
  duplicateTransaction,
  updateTransaction,
  exportTransactionsCsv,
  getRecurringSuggestions,
  markTransactionRecurring,
  dismissRecurringSuggestion,
} from '@/lib/api'
import { useSettings } from '@/contexts/SettingsContext'
import type { Transaction } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import TransactionForm from '@/components/transactions/TransactionForm'
import { Skeleton } from '@/components/ui/skeleton'

export default function Transactions() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, language } = useSettings()

  const translateDbItem = (name: string, type: 'category' | 'payment') => {
    const key = `${type}.${name.toLowerCase()}`
    const translated = t(key)
    return translated !== key ? translated : name
  }

  const dateLocale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US'

  // State for form modal
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  // Filters state from query parameters or default
  const searchQuery = searchParams.get('query') || ''
  const typeFilter = searchParams.get('type') || 'ALL'
  const categoryFilter = searchParams.get('categoryId') || 'ALL'
  const methodFilter = searchParams.get('paymentMethodId') || 'ALL'
  const fromFilter = searchParams.get('from') || ''
  const toFilter = searchParams.get('to') || ''
  const sortBy = searchParams.get('sort') || 'date'
  const sortOrder = (searchParams.get('order') as 'asc' | 'desc') || 'desc'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 15

  const updateFilters = (updates: Record<string, string | number | null>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === 'ALL' || val === '') {
        newParams.delete(key)
      } else {
        newParams.set(key, String(val))
      }
    })
    // Reset page to 1 on filter change
    if (!updates.page && updates.page !== null) {
      newParams.delete('page')
    }
    setSearchParams(newParams)
  }

  // Queries
  const { currency } = useSettings()

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const { data: paymentMethods } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: getPaymentMethods,
  })

  const apiParams = {
    query: searchQuery || undefined,
    type: typeFilter !== 'ALL' ? (typeFilter as 'INCOME' | 'EXPENSE') : undefined,
    categoryId: categoryFilter !== 'ALL' ? parseInt(categoryFilter) : undefined,
    paymentMethodId: methodFilter !== 'ALL' ? parseInt(methodFilter) : undefined,
    from: fromFilter || undefined,
    to: toFilter || undefined,
    sort: sortBy,
    order: sortOrder,
    page,
    limit,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', apiParams],
    queryFn: () => getTransactions(apiParams),
  })

  // Recurring suggestions via pattern recognition / AI
  const { data: recurringSuggestions } = useQuery({
    queryKey: ['recurring-suggestions'],
    queryFn: getRecurringSuggestions,
  })

  const markRecurringMutation = useMutation({
    mutationFn: (txId: number) => markTransactionRecurring(txId, true, 'MONTHLY'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['recurring-suggestions'] })
      toast.success(t('recurring.marked_success'))
    },
    onError: () => toast.error('Falha ao marcar como recorrente'),
  })

  const dismissRecurringMutation = useMutation({
    mutationFn: ({ transactionId, title }: { transactionId: number; title: string }) =>
      dismissRecurringSuggestion(transactionId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-suggestions'] })
      toast.success(t('recurring.dismissed_success'))
    },
    onError: () => toast.error('Falha ao recusar sugestão'),
  })

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(t('transactions.delete_success'))
    },
    onError: () => toast.error(t('transactions.delete_error')),
  })

  const duplicateMutation = useMutation({
    mutationFn: duplicateTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(t('transactions.dup_success'))
    },
    onError: () => toast.error(t('transactions.dup_error')),
  })

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: number; isFavorite: boolean }) =>
      updateTransaction(id, { isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success(t('transactions.fav_success'))
    },
    onError: () => toast.error(t('transactions.fav_error')),
  })

  const handleDelete = (id: number) => {
    if (confirm(t('transactions.delete_confirm'))) {
      deleteMutation.mutate(id)
    }
  }

  const [isExporting, setIsExporting] = useState(false)

  const handleExportCsv = async () => {
    try {
      setIsExporting(true)
      const blob = await exportTransactionsCsv({
        query: searchQuery || undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        categoryId: categoryFilter !== 'ALL' ? parseInt(categoryFilter) : undefined,
        paymentMethodId: methodFilter !== 'ALL' ? parseInt(methodFilter) : undefined,
        from: fromFilter || undefined,
        to: toFilter || undefined,
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('CSV baixado com sucesso!')
    } catch (err) {
      console.error('Export CSV error:', err)
      toast.error('Falha ao exportar CSV')
    } finally {
      setIsExporting(false)
    }
  }

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
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('transactions.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('transactions.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportCsv}
            disabled={isExporting}
            variant="outline"
            className="border-border text-foreground hover:bg-secondary gap-1.5 text-xs rounded-lg"
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? 'Exportando...' : t('transactions.export_csv')}
          </Button>
          <Button
            onClick={() => {
              setEditingTransaction(null)
              setShowForm(true)
            }}
            className="rounded-full bg-[#84a98c] text-white hover:bg-[#2f3e46] dark:hover:bg-[#6b9473] gap-1.5 shadow-sm text-sm"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span>{t('transactions.new_tx')}</span>
          </Button>
        </div>
      </div>

      {/* AI Pattern Recognition / Recurring Suggestions Card */}
      {recurringSuggestions && recurringSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 p-4 shadow-sm backdrop-blur-xs"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-xs">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    {t('recurring.ai_title')}
                  </h4>
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                    {recurringSuggestions.length} {recurringSuggestions.length === 1 ? 'sugestão' : 'sugestões'}
                  </span>
                </div>
                {recurringSuggestions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      recurringSuggestions.forEach(s => {
                        dismissRecurringMutation.mutate({ transactionId: s.transactionId, title: s.title })
                      })
                    }}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground underline transition-colors"
                  >
                    {t('recurring.dismiss_all')}
                  </button>
                )}
              </div>
              <p className="mt-0.5 text-xs text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed">
                {t('recurring.ai_desc')}
              </p>

              <div className="mt-3 flex flex-wrap gap-2.5">
                {recurringSuggestions.map((sug) => (
                  <div
                    key={sug.transactionId}
                    className="flex items-center gap-2 rounded-xl bg-card dark:bg-[#181c24] px-3 py-1.5 text-xs shadow-xs border border-indigo-500/20"
                  >
                    <span className="font-semibold text-foreground">{sug.title}</span>
                    <span className="text-muted-foreground font-mono text-[11px]">({formatCurrency(sug.amount, currency)})</span>
                    <div className="flex items-center gap-1 ml-1">
                      <Button
                        size="sm"
                        onClick={() => markRecurringMutation.mutate(sug.transactionId)}
                        disabled={markRecurringMutation.isPending || dismissRecurringMutation.isPending}
                        className="h-6 px-2 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-md gap-1 shadow-2xs font-medium"
                      >
                        <Check className="h-3 w-3" />
                        {t('recurring.confirm_mark')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissRecurringMutation.mutate({ transactionId: sug.transactionId, title: sug.title })}
                        disabled={markRecurringMutation.isPending || dismissRecurringMutation.isPending}
                        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-md gap-1 transition-colors"
                        title={t('recurring.dismiss')}
                      >
                        <X className="h-3 w-3" />
                        {t('recurring.dismiss')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search & Filters */}
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('transactions.search')}
                value={searchQuery}
                onChange={(e) => updateFilters({ query: e.target.value })}
                className="border-border bg-card dark:bg-[#1b1f27] text-foreground pl-9 text-sm focus-visible:ring-[#84a98c]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={(v) => updateFilters({ type: v })}>
                <SelectTrigger className="w-[120px] text-xs border-border bg-card text-foreground">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('transactions.type_all')}</SelectItem>
                  <SelectItem value="INCOME">{t('transactions.type_income')}</SelectItem>
                  <SelectItem value="EXPENSE">{t('transactions.type_expense')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={(v) => updateFilters({ categoryId: v })}>
                <SelectTrigger className="w-[150px] text-xs border-border bg-card text-foreground">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('transactions.cat_all')}</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {translateDbItem(cat.name, 'category')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Method Filter */}
              <Select value={methodFilter} onValueChange={(v) => updateFilters({ paymentMethodId: v })}>
                <SelectTrigger className="w-[150px] text-xs border-border bg-card text-foreground">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('transactions.method_all')}</SelectItem>
                  {paymentMethods?.map((pm) => (
                    <SelectItem key={pm.id} value={String(pm.id)}>
                      {translateDbItem(pm.name, 'payment')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>{t('transactions.date_range')}</span>
              <Input
                type="date"
                value={fromFilter}
                onChange={(e) => updateFilters({ from: e.target.value })}
                className="h-8 w-[130px] py-1 px-2 border-border bg-card dark:bg-[#1b1f27] text-foreground text-[11px]"
              />
              <span>{t('transactions.to')}</span>
              <Input
                type="date"
                value={toFilter}
                onChange={(e) => updateFilters({ to: e.target.value })}
                className="h-8 w-[130px] py-1 px-2 border-border bg-card dark:bg-[#1b1f27] text-foreground text-[11px]"
              />
            </div>

            <div className="flex items-center gap-2 sm:ml-auto">
              <span>{t('transactions.sort_by')}</span>
              <Select value={sortBy} onValueChange={(v) => updateFilters({ sort: v })}>
                <SelectTrigger className="h-8 w-[100px] text-[11px] border-border bg-card text-foreground">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">{t('transactions.sort_date')}</SelectItem>
                  <SelectItem value="amount">{t('transactions.sort_amount')}</SelectItem>
                  <SelectItem value="title">{t('transactions.sort_title')}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => updateFilters({ order: sortOrder === 'asc' ? 'desc' : 'asc' })}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : data?.transactions && data.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-6 font-semibold">{t('transactions.th_fav')}</th>
                    <th className="py-3 px-6 font-semibold">{t('transactions.th_date')}</th>
                    <th className="py-3 px-6 font-semibold">{t('transactions.th_transaction')}</th>
                    <th className="py-3 px-6 font-semibold">{t('transactions.th_category')}</th>
                    <th className="py-3 px-6 font-semibold">{t('transactions.th_method')}</th>
                    <th className="py-3 px-6 font-semibold text-right">{t('transactions.th_amount')}</th>
                    <th className="py-3 px-6 font-semibold text-right">{t('transactions.th_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-foreground">
                  {data.transactions.map((tx) => {
                    const tags = JSON.parse(tx.tags || '[]') as string[]
                    return (
                      <tr key={tx.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-4 px-6">
                          <button
                            onClick={() =>
                              toggleFavoriteMutation.mutate({ id: tx.id, isFavorite: !tx.isFavorite })
                            }
                            className={`transition-colors ${tx.isFavorite ? 'text-amber-400 hover:text-amber-500' : 'text-muted-foreground/40 hover:text-amber-400'}`}
                          >
                            {tx.isFavorite ? <Star className="h-4 w-4 fill-amber-400" /> : <StarOff className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })}
                          <span className="block text-[10px] text-muted-foreground/70">{tx.time}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <span>{tx.title}</span>
                            {tx.isRecurring && (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 text-[10px] font-semibold border border-indigo-500/20" title={t('recurring.toggle_label')}>
                                <Repeat className="h-2.5 w-2.5" />
                                {t('recurring.toggle_label')}
                              </span>
                            )}
                          </div>
                          {tx.merchant && (
                            <span className="text-xs text-muted-foreground">{tx.merchant}</span>
                          )}
                          {tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {tags.map((tag) => (
                                <span key={tag} className="text-[9px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span
                            className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${tx.category?.color || '#cad2c5'}15`, color: tx.category?.color || '#78716c' }}
                          >
                            {tx.category ? translateDbItem(tx.category.name, 'category') : t('transactions.uncategorized')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-muted-foreground whitespace-nowrap">
                          {tx.paymentMethod ? translateDbItem(tx.paymentMethod.name, 'payment') : translateDbItem('Cash', 'payment')}
                          {tx.installments && (
                            <span className="block text-[10px] text-[#84a98c]">
                              {t('transactions.parc')} {tx.currentInstallment}/{tx.totalInstallments}
                            </span>
                          )}
                        </td>
                        <td className={`py-4 px-6 text-right font-semibold whitespace-nowrap ${tx.type === 'INCOME' ? 'text-[#84a98c]' : 'text-[#e76f51]'}`}>
                          {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                              onClick={() => {
                                setEditingTransaction(tx)
                                setShowForm(true)
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
                              onClick={() => duplicateMutation.mutate(tx.id)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-full"
                              onClick={() => handleDelete(tx.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Star className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">{t('transactions.no_data')}</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/30 text-xs">
              <span className="text-muted-foreground">
                {t('transactions.page_of').replace('{page}', String(data.page)).replace('{totalPages}', String(data.totalPages)).replace('{total}', String(data.total))}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-border"
                  disabled={page <= 1}
                  onClick={() => updateFilters({ page: page - 1 })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-border"
                  disabled={page >= data.totalPages}
                  onClick={() => updateFilters({ page: page + 1 })}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Form Modal */}
      {showForm && (
        <TransactionForm
          open={showForm}
          onClose={() => {
            setShowForm(false)
            setEditingTransaction(null)
          }}
          transaction={editingTransaction}
        />
      )}
    </motion.div>
  )
}
