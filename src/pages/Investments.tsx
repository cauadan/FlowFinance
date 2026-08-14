import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Briefcase,
  X,
} from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'
import {
  getInvestments,
  createInvestment,
  updateInvestment,
  deleteInvestment,
} from '@/lib/api'
import type { Investment } from '@/lib/api'
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
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
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

const INVESTMENT_CATEGORIES = [
  { value: 'Stock', key: 'investments.cat_stock' },
  { value: 'Crypto', key: 'investments.cat_crypto' },
  { value: 'Real Estate', key: 'investments.cat_real_estate' },
  { value: 'Fixed Income', key: 'investments.cat_fixed_income' },
  { value: 'Mutual Fund', key: 'investments.cat_mutual_fund' },
  { value: 'ETF', key: 'investments.cat_etf' },
  { value: 'Other', key: 'investments.cat_other' },
]

export default function Investments() {
  const queryClient = useQueryClient()
  const { t, currency } = useSettings()

  const translateInvestmentCategory = (cat: string) => {
    const found = INVESTMENT_CATEGORIES.find(c => c.value.toLowerCase() === (cat || '').toLowerCase())
    if (found) {
      return t(found.key)
    }
    return cat
  }

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Stock')
  const [broker, setBroker] = useState('')
  const [amountInvested, setAmountInvested] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [notes, setNotes] = useState('')

  const { data: investments, isLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: getInvestments,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createInvestment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(t('investments.create_success'))
      closeModal()
    },
    onError: () => toast.error(t('investments.create_error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Investment> }) => updateInvestment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(t('investments.update_success'))
      closeModal()
    },
    onError: () => toast.error(t('investments.update_error')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteInvestment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(t('investments.delete_success'))
    },
    onError: () => toast.error(t('investments.delete_error')),
  })

  const openAddModal = () => {
    setEditingInvestment(null)
    setName('')
    setCategory('Stock')
    setBroker('')
    setAmountInvested('')
    setCurrentValue('')
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setNotes('')
    setShowModal(true)
  }

  const openEditModal = (inv: Investment) => {
    setEditingInvestment(inv)
    setName(inv.name)
    setCategory(inv.category)
    setBroker(inv.broker || '')
    setAmountInvested(String(inv.amountInvested))
    setCurrentValue(String(inv.currentValue))
    setPurchaseDate(inv.purchaseDate || '')
    setNotes(inv.notes || '')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingInvestment(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !amountInvested || isNaN(parseFloat(amountInvested)) || !currentValue || isNaN(parseFloat(currentValue))) return

    const data: Partial<Investment> = {
      name: name.trim(),
      category,
      broker: broker.trim() || undefined,
      amountInvested: parseFloat(amountInvested),
      currentValue: parseFloat(currentValue),
      purchaseDate: purchaseDate || undefined,
      notes: notes.trim() || undefined,
    }

    if (editingInvestment) {
      updateMutation.mutate({ id: editingInvestment.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id: number) => {
    if (confirm(t('investments.delete_confirm'))) {
      deleteMutation.mutate(id)
    }
  }

  // Calculations
  const totalInvested = investments?.reduce((sum, i) => sum + i.amountInvested, 0) || 0
  const currentTotal = investments?.reduce((sum, i) => sum + i.currentValue, 0) || 0
  const profitLoss = currentTotal - totalInvested
  const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0

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
            {t('investments.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('investments.subtitle')}
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="rounded-full bg-[#84a98c] text-white hover:bg-[#2f3e46] dark:hover:bg-[#6b9473] gap-1.5 shadow-sm text-sm"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span>{t('investments.new')}</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      ) : (
        <>
          {/* Summary metrics */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  {t('investments.total_invested')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(totalInvested, currency)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  {t('investments.current_value')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(currentTotal, currency)}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  {t('investments.total_return')}
                </CardDescription>
                <div className={`p-1.5 rounded-full ${profitLoss >= 0 ? 'bg-[#84a98c]/10 text-[#84a98c]' : 'bg-[#e76f51]/10 text-[#e76f51]'}`}>
                  {profitLoss >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-[#84a98c]' : 'text-[#e76f51]'}`}>
                  {formatCurrency(profitLoss, currency)}
                  <span className="text-xs font-semibold ml-2">
                    ({profitLossPercent >= 0 ? '+' : ''}
                    {formatPercentage(profitLossPercent)})
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investments List */}
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {investments && investments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <th className="py-3 px-6 font-semibold">{t('investments.name')}</th>
                        <th className="py-3 px-6 font-semibold">{t('investments.category')}</th>
                        <th className="py-3 px-6 font-semibold">{t('investments.broker')}</th>
                        <th className="py-3 px-6 font-semibold text-right">{t('investments.total_invested')}</th>
                        <th className="py-3 px-6 font-semibold text-right">{t('investments.current_value')}</th>
                        <th className="py-3 px-6 font-semibold text-right">{t('investments.return_pct')}</th>
                        <th className="py-3 px-6 font-semibold text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(0,0,0,0.04)] text-sm text-[#0c0a09]">
                      {investments.map((inv) => {
                        const invReturn = inv.profitLoss
                        const returnPercent = inv.profitLossPercent
                        const isGain = invReturn >= 0

                        return (
                          <tr key={inv.id} className="hover:bg-[#fafaf5]/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-medium text-[#0c0a09]">{inv.name}</div>
                              {inv.purchaseDate && (
                                <span className="text-[10px] text-stone-400">{t('investments.purchased')}: {formatDate(inv.purchaseDate)}</span>
                              )}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-[#2f3e46]/10 text-[#2f3e46]">
                                {translateInvestmentCategory(inv.category)}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-stone-600 whitespace-nowrap">{inv.broker || '—'}</td>
                            <td className="py-4 px-6 text-right font-medium whitespace-nowrap">
                              {formatCurrency(inv.amountInvested, currency)}
                            </td>
                            <td className="py-4 px-6 text-right font-medium whitespace-nowrap">
                              {formatCurrency(inv.currentValue, currency)}
                            </td>
                            <td className={`py-4 px-6 text-right font-semibold whitespace-nowrap ${isGain ? 'text-[#84a98c]' : 'text-[#e76f51]'}`}>
                              <div>{isGain ? '+' : ''}{formatCurrency(invReturn, currency)}</div>
                              <span className="text-[10px] block">
                                {isGain ? '+' : ''}{formatPercentage(returnPercent)}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-stone-500 rounded-full"
                                  onClick={() => openEditModal(inv)}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-600 rounded-full"
                                  onClick={() => handleDelete(inv.id)}
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
                  <Briefcase className="h-8 w-8 text-[#a8a29e] mb-2" />
                  <p className="text-sm font-medium text-[#78716c]">{t('investments.no_data')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Investment Modal */}
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
                {editingInvestment ? t('investments.modal_edit') : t('investments.modal_new')}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Asset Name */}
              <div className="space-y-1.5">
                <Label htmlFor="assetName" className="text-xs uppercase tracking-wider text-muted-foreground">{t('investments.name')}</Label>
                <Input
                  id="assetName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('investments.name_placeholder')}
                  required
                  className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                />
              </div>

              {/* Category Select */}
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t('investments.category')}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus:ring-[#84a98c]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_CATEGORIES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {t(item.key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Broker */}
                <div className="space-y-1.5">
                  <Label htmlFor="broker" className="text-xs uppercase tracking-wider text-muted-foreground">{t('investments.broker_label')}</Label>
                  <Input
                    id="broker"
                    value={broker}
                    onChange={(e) => setBroker(e.target.value)}
                    placeholder={t('investments.broker_placeholder')}
                    className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                  />
                </div>
                {/* Purchase Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="purchaseD" className="text-xs uppercase tracking-wider text-muted-foreground">{t('investments.purchase_date')}</Label>
                  <Input
                    id="purchaseD"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Invested */}
                <div className="space-y-1.5">
                  <Label htmlFor="amtInvested" className="text-xs uppercase tracking-wider text-muted-foreground">{t('investments.amount_invested')}</Label>
                  <Input
                    id="amtInvested"
                    type="number"
                    step="0.01"
                    value={amountInvested}
                    onChange={(e) => setAmountInvested(e.target.value)}
                    placeholder="0.00"
                    required
                    className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                  />
                </div>
                {/* Current Value */}
                <div className="space-y-1.5">
                  <Label htmlFor="currVal" className="text-xs uppercase tracking-wider text-muted-foreground">{t('investments.current_val')}</Label>
                  <Input
                    id="currVal"
                    type="number"
                    step="0.01"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="0.00"
                    required
                    className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs uppercase tracking-wider text-muted-foreground">{t('investments.notes')}</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('investments.notes_placeholder')}
                  className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1 border-border text-foreground hover:bg-secondary rounded-lg text-xs"
                >
                  {t('investments.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-[#84a98c] text-white hover:bg-[#2f3e46] dark:hover:bg-[#6b9473] rounded-lg text-xs"
                >
                  {createMutation.isPending || updateMutation.isPending ? t('investments.saving') : t('investments.save')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
