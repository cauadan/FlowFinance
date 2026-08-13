import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getCategories, getPaymentMethods, createTransaction, updateTransaction } from '@/lib/api'
import type { Transaction } from '@/lib/api'
import { useSettings } from '@/contexts/SettingsContext'

interface TransactionFormProps {
  open: boolean
  onClose: () => void
  transaction?: Transaction | null
}

export default function TransactionForm({ open, onClose, transaction }: TransactionFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!transaction
  const { t } = useSettings()

  const translateDbItem = (name: string, type: 'category' | 'payment') => {
    const key = `${type}.${name.toLowerCase()}`
    const translated = t(key)
    return translated !== key ? translated : name
  }

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    categoryId: '',
    paymentMethodId: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    merchant: '',
    installments: false,
    currentInstallment: '',
    totalInstallments: '',
    isRecurring: false,
    recurringInterval: 'MONTHLY',
    tags: '',
    notes: '',
    isFavorite: false,
  })

  useEffect(() => {
    if (transaction) {
      setFormData({
        title: transaction.title,
        description: transaction.description || '',
        amount: String(transaction.amount),
        type: transaction.type as 'INCOME' | 'EXPENSE',
        categoryId: String(transaction.categoryId),
        paymentMethodId: String(transaction.paymentMethodId),
        date: transaction.date,
        time: transaction.time,
        merchant: transaction.merchant || '',
        installments: transaction.installments,
        currentInstallment: transaction.currentInstallment ? String(transaction.currentInstallment) : '',
        totalInstallments: transaction.totalInstallments ? String(transaction.totalInstallments) : '',
        isRecurring: Boolean(transaction.isRecurring),
        recurringInterval: transaction.recurringInterval || 'MONTHLY',
        tags: JSON.parse(transaction.tags || '[]').join(', '),
        notes: transaction.notes || '',
        isFavorite: transaction.isFavorite,
      })
    }
  }, [transaction])

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const { data: paymentMethods } = useQuery({
    queryKey: ['paymentMethods'],
    queryFn: getPaymentMethods,
  })

  const filteredCategories = categories?.filter(c => c.type === formData.type) || []

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(t('tx.created'))
      onClose()
    },
    onError: () => toast.error(t('tx.create_error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Transaction> }) => updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(t('tx.updated'))
      onClose()
    },
    onError: () => toast.error(t('tx.update_error')),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean)

    const data: Partial<Transaction> = {
      title: formData.title,
      description: formData.description || undefined,
      amount: parseFloat(formData.amount),
      type: formData.type,
      categoryId: parseInt(formData.categoryId),
      paymentMethodId: parseInt(formData.paymentMethodId),
      date: formData.date,
      time: formData.time,
      merchant: formData.merchant || undefined,
      installments: formData.installments,
      currentInstallment: formData.installments && formData.currentInstallment ? parseInt(formData.currentInstallment) : undefined,
      totalInstallments: formData.installments && formData.totalInstallments ? parseInt(formData.totalInstallments) : undefined,
      isRecurring: formData.isRecurring,
      recurringInterval: formData.isRecurring ? formData.recurringInterval : null,
      tags: JSON.stringify(tagsArray),
      notes: formData.notes || undefined,
      isFavorite: formData.isFavorite,
    }

    if (isEditing && transaction) {
      updateMutation.mutate({ id: transaction.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.05)] p-6">
          <h2 className="font-serif text-xl font-bold tracking-tight text-[#0c0a09]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {isEditing ? t('tx.edit') : t('tx.new')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#fafaf5] p-1">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'EXPENSE', categoryId: '' })}
              className={`rounded-md py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                formData.type === 'EXPENSE'
                  ? 'bg-white text-[#e76f51] shadow-sm'
                  : 'text-[#78716c] hover:text-[#0c0a09]'
              }`}
            >
              {t('tx.expense')}
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'INCOME', categoryId: '' })}
              className={`rounded-md py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                formData.type === 'INCOME'
                  ? 'bg-white text-[#84a98c] shadow-sm'
                  : 'text-[#78716c] hover:text-[#0c0a09]'
              }`}
            >
              {t('tx.income')}
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs uppercase tracking-wider text-[#78716c]">{t('tx.amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
              className="border-[rgba(0,0,0,0.1)] focus-visible:ring-[#84a98c] text-lg font-semibold"
            />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs uppercase tracking-wider text-[#78716c]">{t('tx.title_field')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('tx.title_placeholder')}
              required
              className="border-[rgba(0,0,0,0.1)] focus-visible:ring-[#84a98c]"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs uppercase tracking-wider text-[#78716c]">{t('tx.category')}</Label>
            <Select
              value={formData.categoryId}
              onValueChange={v => setFormData({ ...formData, categoryId: v })}
            >
              <SelectTrigger className="border-[rgba(0,0,0,0.1)] focus:ring-[#84a98c]">
                <SelectValue placeholder={t('tx.category_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span>{translateDbItem(c.name, 'category')}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label htmlFor="paymentMethod" className="text-xs uppercase tracking-wider text-[#78716c]">{t('tx.payment_method')}</Label>
            <Select
              value={formData.paymentMethodId}
              onValueChange={v => setFormData({ ...formData, paymentMethodId: v })}
            >
              <SelectTrigger className="border-[rgba(0,0,0,0.1)] focus:ring-[#84a98c]">
                <SelectValue placeholder={t('tx.payment_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods?.map(pm => (
                  <SelectItem key={pm.id} value={String(pm.id)}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: pm.color }}
                      />
                      <span>{translateDbItem(pm.name, 'payment')}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs uppercase tracking-wider text-[#78716c]">{t('tx.date')}</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
                className="border-[rgba(0,0,0,0.1)] focus-visible:ring-[#84a98c]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time" className="text-xs uppercase tracking-wider text-[#78716c]">{t('tx.time')}</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                required
                className="border-[rgba(0,0,0,0.1)] focus-visible:ring-[#84a98c]"
              />
            </div>
          </div>

          {/* Merchant */}
          <div className="space-y-1.5">
            <Label htmlFor="merchant" className="text-xs uppercase tracking-wider text-[#78716c]">{t('tx.merchant')}</Label>
            <Input
              id="merchant"
              value={formData.merchant}
              onChange={e => setFormData({ ...formData, merchant: e.target.value })}
              placeholder={t('tx.merchant_placeholder')}
              className="border-[rgba(0,0,0,0.1)] focus-visible:ring-[#84a98c]"
            />
          </div>

          {/* Recurring Transaction Toggle & Frequency */}
          <div className="space-y-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#fafaf5] p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#2f3e46]">
                  {t('recurring.toggle_label')}
                </Label>
                <p className="text-[11px] text-[#78716c]">
                  {t('recurring.toggle_desc')}
                </p>
              </div>
              <Switch
                checked={formData.isRecurring}
                onCheckedChange={v => setFormData({ ...formData, isRecurring: v })}
              />
            </div>
            {formData.isRecurring && (
              <div className="pt-2">
                <Label className="text-xs text-[#78716c]">{t('recurring.frequency')}</Label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {[
                    { val: 'MONTHLY', label: t('recurring.monthly') },
                    { val: 'WEEKLY', label: t('recurring.weekly') },
                    { val: 'YEARLY', label: t('recurring.yearly') },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setFormData({ ...formData, recurringInterval: opt.val })}
                      className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        formData.recurringInterval === opt.val
                          ? 'border-[#84a98c] bg-[#84a98c]/15 text-[#2f3e46] font-semibold'
                          : 'border-[rgba(0,0,0,0.08)] bg-white text-stone-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Installments */}
          <div className="space-y-3 rounded-lg bg-[#fafaf5] p-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-[#78716c]">{t('tx.installments')}</Label>
              <Switch
                checked={formData.installments}
                onCheckedChange={v => setFormData({ ...formData, installments: v })}
              />
            </div>
            {formData.installments && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#a8a29e]">{t('tx.current')}</Label>
                  <Input
                    type="number"
                    value={formData.currentInstallment}
                    onChange={e => setFormData({ ...formData, currentInstallment: e.target.value })}
                    placeholder="1"
                    className="mt-1 border-[rgba(0,0,0,0.1)] focus-visible:ring-[#84a98c]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#a8a29e]">{t('tx.total')}</Label>
                  <Input
                    type="number"
                    value={formData.totalInstallments}
                    onChange={e => setFormData({ ...formData, totalInstallments: e.target.value })}
                    placeholder="12"
                    className="mt-1 border-[rgba(0,0,0,0.1)] focus-visible:ring-[#84a98c]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags" className="text-xs uppercase tracking-wider text-[#78716c]">{t('tx.tags')}</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              placeholder={t('tx.tags_placeholder')}
              className="border-[rgba(0,0,0,0.1)] focus-visible:ring-[#84a98c]"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs uppercase tracking-wider text-[#78716c]">{t('tx.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('tx.notes_placeholder')}
              rows={3}
              className="border-[rgba(0,0,0,0.1)] focus-visible:ring-[#84a98c]"
            />
          </div>

          {/* Favorite */}
          <div className="flex items-center gap-3 rounded-lg bg-[#fafaf5] p-4">
            <Switch
              checked={formData.isFavorite}
              onCheckedChange={v => setFormData({ ...formData, isFavorite: v })}
            />
            <Label className="text-sm text-[#78716c]">{t('tx.favorite')}</Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[rgba(0,0,0,0.1)]"
            >
              {t('tx.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-[#84a98c] text-white hover:bg-[#2f3e46]"
            >
              {createMutation.isPending || updateMutation.isPending
                ? t('tx.saving')
                : isEditing ? t('tx.update') : t('tx.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
