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
} from 'lucide-react'
import {
  getTransactions,
  getCategories,
  getPaymentMethods,
  deleteTransaction,
  duplicateTransaction,
  getSettings,
  exportTransactionsCsvUrl,
} from '@/lib/api'
import { useSettings } from '@/contexts/SettingsContext'
import type { Transaction } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
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

  const handleExportCsv = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.append('query', searchQuery)
    if (typeFilter !== 'ALL') params.append('type', typeFilter)
    if (fromFilter) params.append('from', fromFilter)
    if (toFilter) params.append('to', toFilter)
    window.open(`${exportTransactionsCsvUrl}?${params.toString()}`, '_blank')
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
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#0c0a09]" style={{ fontFamily: "'Playfair Display', serif" }}>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#0c0a09]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('transactions.title')}
          </h1>
          <p className="text-sm text-[#78716c]">
            {t('transactions.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportCsv}
            variant="outline"
            className="border-[rgba(0,0,0,0.1)] gap-1.5 text-xs rounded-lg"
          >
            <Download className="h-3.5 w-3.5" />
            {t('transactions.export')}
          </Button>
          <Button
            onClick={() => {
              setEditingTransaction(null)
              setShowForm(true)
            }}
            className="bg-[#84a98c] text-white hover:bg-[#2f3e46] gap-1.5 text-xs rounded-lg shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('transactions.add')}
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="border-[rgba(0,0,0,0.05)] bg-white shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8a29e]" />
              <Input
                placeholder={t('transactions.search')}
                value={searchQuery}
                onChange={(e) => updateFilters({ query: e.target.value })}
                className="border-[rgba(0,0,0,0.08)] bg-white pl-9 text-sm focus-visible:ring-[#84a98c]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={(v) => updateFilters({ type: v })}>
                <SelectTrigger className="w-[120px] text-xs border-[rgba(0,0,0,0.08)]">
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
                <SelectTrigger className="w-[150px] text-xs border-[rgba(0,0,0,0.08)]">
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
                <SelectTrigger className="w-[150px] text-xs border-[rgba(0,0,0,0.08)]">
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

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[rgba(0,0,0,0.04)] text-xs text-[#78716c]">
            <div className="flex items-center gap-2">
              <span>{t('transactions.date_range')}</span>
              <Input
                type="date"
                value={fromFilter}
                onChange={(e) => updateFilters({ from: e.target.value })}
                className="h-8 w-[130px] py-1 px-2 border-[rgba(0,0,0,0.08)] text-[11px]"
              />
              <span>{t('transactions.to')}</span>
              <Input
                type="date"
                value={toFilter}
                onChange={(e) => updateFilters({ to: e.target.value })}
                className="h-8 w-[130px] py-1 px-2 border-[rgba(0,0,0,0.08)] text-[11px]"
              />
            </div>

            <div className="flex items-center gap-2 sm:ml-auto">
              <span>{t('transactions.sort_by')}</span>
              <Select value={sortBy} onValueChange={(v) => updateFilters({ sort: v })}>
                <SelectTrigger className="h-8 w-[100px] text-[11px] border-[rgba(0,0,0,0.08)]">
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
                className="h-8 w-8 text-[#a8a29e]"
                onClick={() => updateFilters({ order: sortOrder === 'asc' ? 'desc' : 'asc' })}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="border-[rgba(0,0,0,0.05)] bg-white shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-[rgba(0,0,0,0.04)] p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : data?.transactions && data.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(0,0,0,0.05)] bg-[#fafaf5]/60 text-[10px] uppercase tracking-wider text-[#78716c]">
                    <th className="py-3 px-6 font-semibold">{t('transactions.th_fav')}</th>
                    <th className="py-3 px-6 font-semibold">{t('transactions.th_date')}</th>
                    <th className="py-3 px-6 font-semibold">{t('transactions.th_transaction')}</th>
                    <th className="py-3 px-6 font-semibold">{t('transactions.th_category')}</th>
                    <th className="py-3 px-6 font-semibold">{t('transactions.th_method')}</th>
                    <th className="py-3 px-6 font-semibold text-right">{t('transactions.th_amount')}</th>
                    <th className="py-3 px-6 font-semibold text-right">{t('transactions.th_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(0,0,0,0.04)] text-sm text-[#0c0a09]">
                  {data.transactions.map((tx) => {
                    const tags = JSON.parse(tx.tags || '[]') as string[]
                    return (
                      <tr key={tx.id} className="hover:bg-[#fafaf5]/50 transition-colors">
                        <td className="py-4 px-6">
                          <button
                            onClick={() =>
                              toggleFavoriteMutation.mutate({ id: tx.id, isFavorite: !tx.isFavorite })
                            }
                            className={`transition-colors ${tx.isFavorite ? 'text-amber-400 hover:text-amber-500' : 'text-stone-300 hover:text-amber-400'}`}
                          >
                            {tx.isFavorite ? <Star className="h-4 w-4 fill-amber-400" /> : <StarOff className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-xs text-[#78716c] whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })}
                          <span className="block text-[10px] text-stone-400">{tx.time}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-[#0c0a09]">{tx.title}</div>
                          {tx.merchant && (
                            <span className="text-xs text-stone-400">{tx.merchant}</span>
                          )}
                          {tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {tags.map((tag) => (
                                <span key={tag} className="text-[9px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-500 font-mono">
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
                        <td className="py-4 px-6 text-xs text-[#78716c] whitespace-nowrap">
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
                              className="h-8 w-8 text-stone-500 rounded-full"
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
                              className="h-8 w-8 text-stone-500 rounded-full"
                              onClick={() => duplicateMutation.mutate(tx.id)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 rounded-full"
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
              <Star className="h-8 w-8 text-[#a8a29e] mb-2" />
              <p className="text-sm font-medium text-[#78716c]">{t('transactions.no_data')}</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[rgba(0,0,0,0.05)] bg-[#fafaf5]/40 text-xs">
              <span className="text-[#a8a29e]">
                {t('transactions.page_of').replace('{page}', String(data.page)).replace('{totalPages}', String(data.totalPages)).replace('{total}', String(data.total))}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-[rgba(0,0,0,0.1)]"
                  disabled={page <= 1}
                  onClick={() => updateFilters({ page: page - 1 })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-[rgba(0,0,0,0.1)]"
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
