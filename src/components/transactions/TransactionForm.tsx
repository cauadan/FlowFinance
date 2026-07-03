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

interface TransactionFormProps {
  open: boolean
  onClose: () => void
  transaction?: Transaction | null
}

export default function TransactionForm({ open, onClose, transaction }: TransactionFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!transaction

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
      toast.success('Transaction created successfully')
      onClose()
    },
    onError: () => toast.error('Failed to create transaction'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Transaction> }) => updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transaction updated successfully')
      onClose()
    },
    onError: () => toast.error('Failed to update transaction'),
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
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[rgba(0,0,0,0.05)] bg-white px-6 py-4">
          <h2 className="text-lg font-medium text-[#0c0a09]">
            {isEditing ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                formData.type === 'EXPENSE'
                  ? 'bg-[#e76f51] text-white'
                  : 'bg-[#f5f5f0] text-[#78716c] hover:bg-[#fafaf5]'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'INCOME' })}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                formData.type === 'INCOME'
                  ? 'bg-[#84a98c] text-white'
                  : 'bg-[#f5f5f0] text-[#78716c] hover:bg-[#fafaf5]'
              }`}
            >
              Income
            </button>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs uppercase tracking-wider text-[#78716c]">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Grocery Shopping"
              required
              className="border-[rgba(0,0,0,0.1)] focus-visible:ring-[#84a98c]"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-xs uppercase tracking-wider text-[#78716c]">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
              className="border-[rgba(0,0,0,0.1)] font-serif text-lg focus-visible:ring-[#84a98c]"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-[#78716c]">Category</Label>
            <Select value={formData.categoryId} onValueChange={v => setFormData({ ...formData, categoryId: v })}>
              <SelectTrigger className="border-[rgba(0,0,0,0.1)] focus:ring-[#84a98c]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map(cat => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-[#78716c]">Payment Method</Label>
            <Select value={formData.paymentMethodId} onValueChange={v => setFormData({ ...formData, paymentMethodId: v })}>
              <SelectTrigger className="border-[rgba(0,0,0,0.1)] focus:ring-[#84a98c]">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods?.map(pm => (
                  <SelectItem key={pm.id} value={String(pm.id)}>
                    {pm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs uppercase tracking-wider text-[#78716c]">Date</Label>
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
              <Label htmlFor="time" className="text-xs uppercase tracking-wider text-[#78716c]">Time</Label>
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
            <Label htmlFor="merchant" className="text-xs uppercase tracking-wider text-[#78716c]">Merchant / Store</Label>
            <Input
              id="merchant"
              value={formData.merchant}
              onChange={e => setFormData({ ...formData, merchant: e.target.value })}
              placeholder="e.g., Whole Foods"
              className="border-[rgba(0,0,0,0.1)] focus-visible:ring-[#84a98c]"
            />
          </div>

          {/* Installments */}
          <div className="space-y-3 rounded-lg bg-[#fafaf5] p-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-[#78716c]">Installments</Label>
              <Switch
                checked={formData.installments}
                onCheckedChange={v => setFormData({ ...formData, installments: v })}
              />
            </div>
            {formData.installments && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#a8a29e]">Current</Label>
                  <Input
                    type="number"
                    value={formData.currentInstallment}
                    onChange={e => setFormData({ ...formData, currentInstallment: e.target.value })}
                    placeholder="1"
                    className="mt-1 border-[rgba(0,0,0,0.1)] focus-visible:ring-[#84a98c]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#a8a29e]">Total</Label>
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
            <Label htmlFor="tags" className="text-xs uppercase tracking-wider text-[#78716c]">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              placeholder="food, weekly, important"
              className="border-[rgba(0,0,0,0.1)] focus-visible:ring-[#84a98c]"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs uppercase tracking-wider text-[#78716c]">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
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
            <Label className="text-sm text-[#78716c]">Mark as favorite</Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[rgba(0,0,0,0.1)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-[#84a98c] text-white hover:bg-[#2f3e46]"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEditing ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
