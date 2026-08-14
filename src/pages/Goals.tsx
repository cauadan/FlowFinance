import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Plus,
  Edit2,
  Trash2,
  Target,
  Gift,
  Home,
  Car,
  Landmark,
  BookOpen,
  Laptop,
  Plane,
  Shield,
  Trophy,
  X,
  PiggyBank,
  Check,
} from 'lucide-react'
import { getGoals, createGoal, updateGoal, deleteGoal } from '@/lib/api'
import type { Goal } from '@/lib/api'
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils'
import { useSettings } from '@/contexts/SettingsContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

const iconMap: Record<string, any> = {
  target: Target,
  gift: Gift,
  home: Home,
  car: Car,
  landmark: Landmark,
  book: BookOpen,
  laptop: Laptop,
  plane: Plane,
  shield: Shield,
  trophy: Trophy,
  piggy: PiggyBank,
}

const colorPalette = [
  '#84a98c', // Sage
  '#52796f', // Forest
  '#354f52', // Dark Teal
  '#2f3e46', // Slate Blue
  '#e76f51', // Rust
  '#f4a261', // Terracotta
  '#e9c46a', // Gold
  '#2a9d8f', // Aqua
  '#4f46e5', // Indigo
  '#9d174d', // Rose Plum
  '#0284c7', // Sky Blue
  '#7c3aed', // Purple
]

export default function Goals() {
  const queryClient = useQueryClient()
  const { t, currency } = useSettings()

  // Modals state
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showContribModal, setShowContribModal] = useState(false)
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)

  // Goal Form State
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [selectedColor, setSelectedColor] = useState('#84a98c')
  const [selectedIcon, setSelectedIcon] = useState('target')

  // Contribution Form State
  const [contribAmount, setContribAmount] = useState('')
  const [contribType, setContribType] = useState<'ADD' | 'WITHDRAW'>('ADD')

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: getGoals,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success(t('goals.create_success'))
      closeGoalModal()
    },
    onError: () => toast.error(t('goals.create_error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Goal> }) => updateGoal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success(t('goals.update_success'))
      closeGoalModal()
      closeContribModal()
    },
    onError: () => toast.error(t('goals.update_error')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success(t('goals.delete_success'))
    },
    onError: () => toast.error(t('goals.delete_error')),
  })

  const openAddModal = () => {
    setActiveGoal(null)
    setName('')
    setTargetAmount('')
    setCurrentAmount('0')
    setTargetDate('')
    setSelectedColor('#84a98c')
    setSelectedIcon('target')
    setShowGoalModal(true)
  }

  const openEditModal = (goal: Goal) => {
    setActiveGoal(goal)
    setName(goal.name)
    setTargetAmount(String(goal.targetAmount))
    setCurrentAmount(String(goal.currentAmount))
    setTargetDate(goal.targetDate || '')
    setSelectedColor(goal.color)
    setSelectedIcon(goal.icon)
    setShowGoalModal(true)
  }

  const openContribModal = (goal: Goal) => {
    setActiveGoal(goal)
    setContribAmount('')
    setContribType('ADD')
    setShowContribModal(true)
  }

  const closeGoalModal = () => {
    setShowGoalModal(false)
    setActiveGoal(null)
  }

  const closeContribModal = () => {
    setShowContribModal(false)
    setActiveGoal(null)
  }

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !targetAmount || isNaN(parseFloat(targetAmount))) return

    const data: Partial<Goal> = {
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      targetDate: targetDate || null,
      color: selectedColor,
      icon: selectedIcon,
    }

    if (activeGoal) {
      updateMutation.mutate({ id: activeGoal.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleContribSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeGoal || !contribAmount || isNaN(parseFloat(contribAmount))) return

    const val = parseFloat(contribAmount)
    let newAmount = activeGoal.currentAmount
    if (contribType === 'ADD') {
      newAmount += val
    } else {
      newAmount = Math.max(0, newAmount - val)
    }

    updateMutation.mutate({
      id: activeGoal.id,
      data: { currentAmount: newAmount },
    })
  }

  const handleDelete = (id: number) => {
    if (confirm(t('goals.delete_confirm'))) {
      deleteMutation.mutate(id)
    }
  }

  // Summary stats
  const totalTarget = goals?.reduce((sum, g) => sum + g.targetAmount, 0) || 0
  const totalSaved = goals?.reduce((sum, g) => sum + g.currentAmount, 0) || 0
  const totalRemaining = totalTarget - totalSaved
  const overallPercentage = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

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
            {t('goals.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('goals.subtitle')}
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="rounded-full bg-[#84a98c] text-white hover:bg-[#2f3e46] dark:hover:bg-[#6b9473] gap-1.5 shadow-sm text-sm"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span>{t('goals.new')}</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-28 rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          {goals && goals.length > 0 && (
            <Card className="border-border bg-card shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-4 items-center">
                  <div className="md:col-span-3 space-y-3">
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>{t('goals.progress')}</span>
                      <span className="text-foreground font-bold">{formatPercentage(overallPercentage)} {t('goals.completed')}</span>
                    </div>
                    <Progress value={Math.min(overallPercentage, 100)} className="h-3" indicatorClassName="bg-[#84a98c]" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t('goals.saved')}: <strong className="text-foreground">{formatCurrency(totalSaved, currency)}</strong></span>
                      <span>{t('goals.target')}: <strong className="text-foreground">{formatCurrency(totalTarget, currency)}</strong></span>
                    </div>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 text-center md:text-left">
                    <span className="text-xs uppercase text-muted-foreground block">{t('goals.to_save')}</span>
                    <span className="text-2xl font-bold text-[#84a98c]">
                      {formatCurrency(totalRemaining, currency)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Goals Grid */}
          {goals && goals.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => {
                const IconComponent = iconMap[goal.icon] || Target
                const isCompleted = goal.currentAmount >= goal.targetAmount

                return (
                  <Card key={goal.id} className="border-border bg-card shadow-sm relative overflow-hidden group hover:border-[#84a98c]/30 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-lg flex items-center justify-center text-white shadow-xs"
                          style={{ backgroundColor: goal.color }}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold text-foreground">
                            {goal.name}
                          </CardTitle>
                          {goal.targetDate && (
                            <span className="text-[10px] text-muted-foreground">
                              {t('goals.by')} {formatDate(goal.targetDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                          onClick={() => openEditModal(goal)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => handleDelete(goal.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-[#0c0a09]">
                          {formatCurrency(goal.currentAmount, currency)}
                        </span>
                        <span className="text-xs text-[#a8a29e]">
                          {t('goals.of')} {formatCurrency(goal.targetAmount, currency)}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <Progress value={Math.min(goal.percentage, 100)} className="h-2" indicatorClassName="bg-[#84a98c]" />
                        <div className="flex justify-between items-center text-[10px] text-stone-400">
                          <span>{formatPercentage(goal.percentage)} {t('goals.complete')}</span>
                          {isCompleted ? (
                            <span className="font-semibold text-[#84a98c]">{t('goals.achieved')}</span>
                          ) : (
                            <span>{formatCurrency(goal.remaining, currency)} {t('goals.left')}</span>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => openContribModal(goal)}
                        variant="outline"
                        className="w-full text-xs h-8 border-[rgba(0,0,0,0.08)] bg-[#fafaf5]/60 hover:bg-[#84a98c] hover:text-white"
                      >
                        {t('goals.contribute')}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[rgba(0,0,0,0.08)] rounded-xl bg-white">
              <Target className="h-10 w-10 text-[#a8a29e] mb-2" />
              <p className="text-sm font-medium text-[#78716c]">{t('goals.no_data')}</p>
              <Button onClick={openAddModal} variant="link" className="text-[#84a98c] text-xs font-semibold mt-1">
                {t('goals.first')}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Goal Add/Edit Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={closeGoalModal} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md rounded-2xl bg-card dark:bg-[#161922] p-6 shadow-2xl border border-border text-card-foreground"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <h3 className="text-lg font-bold text-foreground">
                {activeGoal ? t('goals.modal_edit') : t('goals.modal_new')}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeGoalModal} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleGoalSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="goalName" className="text-xs uppercase tracking-wider text-muted-foreground">{t('goals.name')}</Label>
                <Input
                  id="goalName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('goals.name_placeholder')}
                  required
                  className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="targetAmt" className="text-xs uppercase tracking-wider text-muted-foreground">{t('goals.target_amount')}</Label>
                  <Input
                    id="targetAmt"
                    type="number"
                    step="0.01"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="currentAmt" className="text-xs uppercase tracking-wider text-muted-foreground">{t('goals.current_savings')}</Label>
                  <Input
                    id="currentAmt"
                    type="number"
                    step="0.01"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0.00"
                    className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="goalDate" className="text-xs uppercase tracking-wider text-muted-foreground">{t('goals.target_date')}</Label>
                <Input
                  id="goalDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t('goals.theme_color')}</Label>
                <div className="flex flex-wrap gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className="h-7 w-7 rounded-full border border-border flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-xs"
                      style={{ backgroundColor: color }}
                    >
                      {selectedColor === color && (
                        <Check className="h-3 w-3 text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t('goals.icon')}</Label>
                <div className="flex flex-wrap gap-2 p-1.5 border rounded-lg bg-secondary/50 dark:bg-[#1b1f27] border-border">
                  {Object.entries(iconMap).map(([iconName, IconComponent]) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${
                        selectedIcon === iconName
                          ? 'bg-[#84a98c] text-white shadow-xs'
                          : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeGoalModal}
                  className="flex-1 border-border text-foreground hover:bg-secondary rounded-lg text-xs"
                >
                  {t('goals.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-[#84a98c] text-white hover:bg-[#2f3e46] dark:hover:bg-[#6b9473] rounded-lg text-xs"
                >
                  {createMutation.isPending || updateMutation.isPending ? t('goals.saving') : t('goals.save')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Contribution Dialog */}
      {showContribModal && activeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={closeContribModal} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-sm rounded-2xl bg-card dark:bg-[#161922] p-6 shadow-2xl border border-border text-card-foreground"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">{t('goals.manage_funds')}</h3>
                <span className="text-xs text-muted-foreground">{activeGoal.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={closeContribModal} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleContribSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="flex gap-2 p-1 bg-secondary/70 dark:bg-[#1b1f27] rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setContribType('ADD')}
                  className={`flex-1 text-xs py-1.5 font-semibold rounded-md transition-all ${
                    contribType === 'ADD'
                      ? 'bg-card shadow-xs text-[#84a98c]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('goals.add_savings')}
                </button>
                <button
                  type="button"
                  onClick={() => setContribType('WITHDRAW')}
                  className={`flex-1 text-xs py-1.5 font-semibold rounded-md transition-all ${
                    contribType === 'WITHDRAW'
                      ? 'bg-card shadow-xs text-[#e76f51]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('goals.withdraw')}
                </button>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="contribAmt" className="text-xs uppercase tracking-wider text-muted-foreground">{t('goals.amount')}</Label>
                <Input
                  id="contribAmt"
                  type="number"
                  step="0.01"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                />
              </div>

              <div className="text-[11px] text-muted-foreground">
                {t('goals.current_state')}: <strong className="text-foreground">{formatCurrency(activeGoal.currentAmount, currency)}</strong> {t('goals.of')} <strong className="text-foreground">{formatCurrency(activeGoal.targetAmount, currency)}</strong>.
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeContribModal}
                  className="flex-1 border-border text-foreground hover:bg-secondary rounded-lg text-xs"
                >
                  {t('goals.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 bg-[#84a98c] text-white hover:bg-[#2f3e46] dark:hover:bg-[#6b9473] rounded-lg text-xs"
                >
                  {updateMutation.isPending ? t('goals.saving') : t('goals.confirm')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
