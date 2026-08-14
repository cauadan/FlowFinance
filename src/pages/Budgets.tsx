import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Plus,
  Edit2,
  Trash2,
  Wallet,
  Calendar,
  X,
  AlertTriangle,
} from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'
import {
  getBudgets,
  getCategories,
  createBudget,
  updateBudget,
  deleteBudget,
} from '@/lib/api'
import type { Budget } from '@/lib/api'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export default function Budgets() {
  const queryClient = useQueryClient()
  const { t, currency } = useSettings()
  const now = new Date()

  const translateDbItem = (name: string, type: 'category' | 'payment') => {
    const key = `${type}.${name.toLowerCase()}`
    const translated = t(key)
    return translated !== key ? translated : name
  }

  // Select month / year state
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())

  // Modal form state
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [amount, setAmount] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')

  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets', selectedMonth, selectedYear],
    queryFn: () => getBudgets({ month: selectedMonth, year: selectedYear }),
  })

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(t('budgets.create_success'))
      closeModal()
    },
    onError: () => toast.error(t('budgets.create_error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Budget> }) => updateBudget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(t('budgets.update_success'))
      closeModal()
    },
    onError: () => toast.error(t('budgets.update_error')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(t('budgets.delete_success'))
    },
    onError: () => toast.error(t('budgets.delete_error')),
  })

  const openAddModal = () => {
    setEditingBudget(null)
    setAmount('')
    setSelectedCategoryId('')
    setShowModal(true)
  }

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget)
    setAmount(String(budget.amount))
    setSelectedCategoryId(String(budget.categoryId))
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingBudget(null)
    setAmount('')
    setSelectedCategoryId('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error(t('budgets.valid_amount'))
      return
    }
    if (!selectedCategoryId) {
      toast.error(t('budgets.select_category'))
      return
    }

    const data: Partial<Budget> = {
      amount: parseFloat(amount),
      categoryId: parseInt(selectedCategoryId),
      month: selectedMonth,
      year: selectedYear,
      period: 'MONTHLY',
    }

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id: number) => {
    if (confirm(t('budgets.delete_confirm'))) {
      deleteMutation.mutate(id)
    }
  }

  // Filter categories to only expense categories and exclude categories already having a budget
  const expenseCategories = categories?.filter((c) => c.type === 'EXPENSE') || []
  const usedCategoryIds = budgets?.map((b) => b.categoryId) || []
  const availableCategories = expenseCategories.filter(
    (c) => !usedCategoryIds.includes(c.id) || (editingBudget && editingBudget.categoryId === c.id)
  )

  // Calculations
  const totalAllocated = budgets?.reduce((sum, b) => sum + b.amount, 0) || 0
  const totalSpent = budgets?.reduce((sum, b) => sum + b.spent, 0) || 0
  const totalRemaining = totalAllocated - totalSpent
  const overallPercentage = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0

  const isLoading = budgetsLoading || categoriesLoading

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

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
            {t('budgets.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('budgets.subtitle')}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Month Select */}
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-[120px] text-xs border-border bg-card text-foreground">
              <Calendar className="h-3 w-3 text-muted-foreground mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, idx) => (
                <SelectItem key={idx} value={String(idx + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year Select */}
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[100px] text-xs border-border bg-card text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={openAddModal}
            className="rounded-full bg-[#84a98c] text-white hover:bg-[#2f3e46] dark:hover:bg-[#6b9473] gap-1.5 shadow-sm text-sm"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span>{t('budgets.set')}</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-28 rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          {budgets && budgets.length > 0 && (
            <Card className="border-border bg-card shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-4 items-center">
                  <div className="md:col-span-3 space-y-3">
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>{t('budgets.progress')}</span>
                      <span className="text-foreground font-bold">{formatPercentage(overallPercentage)} {t('budgets.used')}</span>
                    </div>
                    <Progress
                      value={Math.min(overallPercentage, 100)}
                      className="h-3"
                      indicatorClassName={
                        overallPercentage > 100
                          ? 'bg-[#e76f51]'
                          : overallPercentage > 85
                          ? 'bg-amber-400'
                          : 'bg-[#84a98c]'
                      }
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t('budgets.spent')}: <strong className="text-foreground">{formatCurrency(totalSpent, currency)}</strong></span>
                      <span>{t('budgets.total_limit')}: <strong className="text-foreground">{formatCurrency(totalAllocated, currency)}</strong></span>
                    </div>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 text-center md:text-left">
                    <span className="text-xs uppercase text-muted-foreground block">{t('budgets.remaining')}</span>
                    <span className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-[#84a98c]' : 'text-[#e76f51]'}`}>
                      {formatCurrency(totalRemaining, currency)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budgets Grid */}
          {budgets && budgets.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {budgets.map((budget) => {
                const isOverBudget = budget.percentage > 100
                const isNearingLimit = budget.percentage > 85 && budget.percentage <= 100
                const progressBarColor = isOverBudget
                  ? 'bg-[#e76f51]'
                  : isNearingLimit
                  ? 'bg-amber-400'
                  : 'bg-[#84a98c]'

                return (
                  <Card key={budget.id} className="border-border bg-card shadow-sm relative overflow-hidden group hover:border-[#84a98c]/30 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: budget.category?.color || '#cad2c5' }}
                        />
                        <CardTitle className="text-sm font-semibold text-foreground">
                          {budget.category ? translateDbItem(budget.category.name, 'category') : 'Uncategorized'}
                        </CardTitle>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                          onClick={() => openEditModal(budget)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => handleDelete(budget.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-foreground">
                          {formatCurrency(budget.spent, currency)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t('budgets.of')} {formatCurrency(budget.amount, currency)}
                        </span>
                      </div>

                      <Progress value={Math.min(budget.percentage, 100)} className="h-2" indicatorClassName={progressBarColor} />

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">{formatPercentage(budget.percentage)} {t('budgets.used')}</span>
                        <span className={`font-semibold ${budget.remaining >= 0 ? 'text-[#84a98c]' : 'text-[#e76f51]'}`}>
                          {budget.remaining >= 0
                            ? `${formatCurrency(budget.remaining, currency)} ${t('budgets.left')}`
                            : `${formatCurrency(Math.abs(budget.remaining), currency)} ${t('budgets.over')}`}
                        </span>
                      </div>

                      {isOverBudget && (
                        <div className="flex items-center gap-1.5 mt-2 rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>{t('budgets.exceeded')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl bg-card">
              <Wallet className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-muted-foreground">{t('budgets.no_data')}</p>
              <Button onClick={openAddModal} variant="link" className="text-[#84a98c] text-xs font-semibold mt-1">
                {t('budgets.first')}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Budget Set Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={closeModal} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md rounded-2xl bg-card dark:bg-[#161922] p-6 shadow-2xl border border-border text-card-foreground"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <h3 className="text-lg font-bold text-foreground">
                {editingBudget ? t('budgets.modal_edit') : t('budgets.modal_new')}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Select */}
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t('budgets.category')}</Label>
                {editingBudget ? (
                  <div className="flex items-center gap-2 p-2.5 border border-border rounded-lg bg-secondary/50 text-foreground text-sm font-medium">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: editingBudget.category?.color || '#cad2c5' }}
                    />
                    {editingBudget.category ? translateDbItem(editingBudget.category.name, 'category') : ''}
                  </div>
                ) : (
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus:ring-[#84a98c]">
                      <SelectValue placeholder={t('budgets.category_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {translateDbItem(cat.name, 'category')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="budgetAmount" className="text-xs uppercase tracking-wider text-muted-foreground">{t('budgets.limit_amount')}</Label>
                <Input
                  id="budgetAmount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                />
              </div>

              {/* Period Alert/Note */}
              <div className="p-3 bg-secondary/50 border border-border rounded-lg text-muted-foreground text-[11px]">
                {t('budgets.note')} <strong className="text-foreground">{months[selectedMonth - 1]} {selectedYear}</strong>.
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1 border-border text-foreground hover:bg-secondary rounded-lg text-xs"
                >
                  {t('budgets.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-[#84a98c] text-white hover:bg-[#2f3e46] dark:hover:bg-[#6b9473] rounded-lg text-xs"
                >
                  {createMutation.isPending || updateMutation.isPending ? t('budgets.saving') : t('budgets.save')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
