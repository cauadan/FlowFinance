import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Minus,
  Sliders,
  X,
  Sparkles,
  Lock,
} from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'
import {
  getEmergencyFund,
  updateEmergencyFund,
  emergencyFundTransaction,
} from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export default function EmergencyFundPage() {
  const queryClient = useQueryClient()
  const { t, currency } = useSettings()

  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT')
  const [actionAmount, setActionAmount] = useState('')

  // Config modal state
  const [targetMonths, setTargetMonths] = useState(6)
  const [customTargetAmount, setCustomTargetAmount] = useState('')
  const [notes, setNotes] = useState('')

  const { data: fund, isLoading } = useQuery({
    queryKey: ['emergency-fund'],
    queryFn: getEmergencyFund,
  })

  const updateMutation = useMutation({
    mutationFn: updateEmergencyFund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-fund'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(t('emergency.save_success'))
      setShowConfigModal(false)
    },
    onError: () => toast.error(t('emergency.save_error')),
  })

  const transactionMutation = useMutation({
    mutationFn: ({ type, amount }: { type: 'DEPOSIT' | 'WITHDRAW'; amount: number }) =>
      emergencyFundTransaction(type, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-fund'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(t('emergency.save_success'))
      setShowActionModal(false)
      setActionAmount('')
    },
    onError: () => toast.error(t('emergency.save_error')),
  })

  const openConfig = () => {
    if (fund) {
      setTargetMonths(fund.targetMonths || 6)
      setCustomTargetAmount(String(fund.targetAmount || ''))
      setNotes(fund.notes || '')
    }
    setShowConfigModal(true)
  }

  const openAction = (type: 'DEPOSIT' | 'WITHDRAW') => {
    setActionType(type)
    setActionAmount('')
    setShowActionModal(true)
  }

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(customTargetAmount)
    updateMutation.mutate({
      targetMonths,
      targetAmount: !isNaN(amount) && amount > 0 ? amount : undefined,
      notes,
    })
  }

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(actionAmount)
    if (isNaN(val) || val <= 0) return
    transactionMutation.mutate({ type: actionType, amount: val })
  }

  const currentAmount = fund?.currentAmount || 0
  const targetAmount = fund?.targetAmount || 1
  const progressPercent = fund ? Math.min(100, Math.round((currentAmount / targetAmount) * 100)) : 0
  const remaining = Math.max(0, targetAmount - currentAmount)

  // Months covered calculation
  const monthsCovered = fund?.avgMonthlyExpense && fund.avgMonthlyExpense > 0
    ? (currentAmount / fund.avgMonthlyExpense).toFixed(1)
    : '0'

  const isGreenZone = parseFloat(monthsCovered) >= (fund?.targetMonths || 6)
  const isYellowZone = parseFloat(monthsCovered) >= 3 && !isGreenZone

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
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t('emergency.title')}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <Lock className="h-3 w-3" />
              Blindagem Financeira
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('emergency.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => openAction('DEPOSIT')}
            className="rounded-full bg-[#84a98c] text-white hover:bg-[#2f3e46] dark:hover:bg-[#6b9473] gap-1.5 shadow-sm text-xs"
            size="sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t('emergency.deposit')}</span>
          </Button>
          <Button
            onClick={() => openAction('WITHDRAW')}
            variant="outline"
            className="rounded-full border-border text-[#e76f51] hover:bg-red-500/10 gap-1.5 text-xs shadow-sm"
            size="sm"
          >
            <Minus className="h-3.5 w-3.5" />
            <span>{t('emergency.withdraw')}</span>
          </Button>
          <Button
            onClick={openConfig}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            title={t('emergency.edit')}
          >
            <Sliders className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Main Hero Card with Safety Status */}
          <div
            className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-xl"
            style={{
              background: isGreenZone
                ? 'linear-gradient(135deg, #2f3e46 0%, #354f52 35%, #52796f 75%, #84a98c 100%)'
                : isYellowZone
                ? 'linear-gradient(135deg, #2f3e46 0%, #354f52 40%, #d4a373 100%)'
                : 'linear-gradient(135deg, #2f3e46 0%, #4a2828 50%, #e76f51 100%)',
            }}
          >
            <div className="absolute right-0 top-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {isGreenZone ? (
                    <ShieldCheck className="h-6 w-6 text-emerald-300" />
                  ) : isYellowZone ? (
                    <Shield className="h-6 w-6 text-amber-300" />
                  ) : (
                    <ShieldAlert className="h-6 w-6 text-rose-300" />
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    {isGreenZone ? t('emergency.zone_green') : isYellowZone ? t('emergency.zone_yellow') : t('emergency.zone_red')}
                  </span>
                </div>
                <div className="text-4xl font-bold tracking-tight md:text-5xl">
                  {formatCurrency(currentAmount, currency)}
                </div>
                <p className="text-sm text-white/80">
                  Cobre aproximadamente <strong className="text-white font-semibold">{monthsCovered} {t('emergency.months_expenses')}</strong> (Meta: {fund?.targetMonths || 6} meses).
                </p>
              </div>

              <div className="flex flex-col items-start md:items-end gap-2 border-t border-white/10 pt-4 md:border-t-0 md:pt-0">
                <span className="text-xs text-white/70">{t('emergency.progress')}</span>
                <span className="text-3xl font-bold">{progressPercent}%</span>
                <span className="text-xs text-white/70">
                  {t('emergency.remaining')}: {formatCurrency(remaining, currency)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative mt-6">
              <div className="h-3 w-full overflow-hidden rounded-full bg-black/20 p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-white shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  {t('emergency.target')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(targetAmount, currency)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {fund?.targetMonths || 6} {t('emergency.months_expenses')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Média Mensal de Gastos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(fund?.avgMonthlyExpense || 0, currency)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Baseado nos últimos meses
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Meta Recomendada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#84a98c]">
                  {formatCurrency(fund?.suggestedTarget || 0, currency)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cálculo automático inteligente
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Guidelines Box */}
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#84a98c]/15 text-[#84a98c]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-foreground">Como funciona a sua Reserva de Emergência</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A reserva de emergência deve ser mantida em investimentos de alta liquidez e baixíssimo risco (como Tesouro Selic ou CDBs 100% CDI com resgate diário). Ela garante sua tranquilidade em caso de imprevistos médicos, manutenções urgentes ou perda temporária de renda.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Action Modal (Deposit / Withdraw) */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowActionModal(false)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-sm rounded-2xl bg-card dark:bg-[#161922] p-6 shadow-2xl border border-border text-card-foreground"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <h3 className="text-base font-bold text-foreground">
                {actionType === 'DEPOSIT' ? t('emergency.deposit') : t('emergency.withdraw')}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowActionModal(false)} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="actAmt" className="text-xs uppercase tracking-wider text-muted-foreground">{t('emergency.amount')}</Label>
                <Input
                  id="actAmt"
                  type="number"
                  step="0.01"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  autoFocus
                  className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c] text-lg font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 border-border text-foreground hover:bg-secondary rounded-lg text-xs"
                >
                  {t('emergency.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={transactionMutation.isPending}
                  className={`flex-1 text-white rounded-lg text-xs ${actionType === 'DEPOSIT' ? 'bg-[#84a98c] hover:bg-[#2f3e46]' : 'bg-[#e76f51] hover:bg-red-600'}`}
                >
                  {transactionMutation.isPending ? '...' : t('emergency.confirm')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowConfigModal(false)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md rounded-2xl bg-card dark:bg-[#161922] p-6 shadow-2xl border border-border text-card-foreground"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <h3 className="text-lg font-bold text-foreground">
                {t('emergency.edit')}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowConfigModal(false)} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleConfigSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t('emergency.months_label')}
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 6, 9, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setTargetMonths(m)
                        if (fund?.avgMonthlyExpense) {
                          setCustomTargetAmount(String(Math.round(fund.avgMonthlyExpense * m)))
                        }
                      }}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        targetMonths === m
                          ? 'border-[#84a98c] bg-[#84a98c]/15 text-[#84a98c]'
                          : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {m} {t('emergency.months')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cfgTarget" className="text-xs uppercase tracking-wider text-muted-foreground">{t('emergency.target_amount')}</Label>
                <Input
                  id="cfgTarget"
                  type="number"
                  step="0.01"
                  value={customTargetAmount}
                  onChange={(e) => setCustomTargetAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs uppercase tracking-wider text-muted-foreground">{t('investments.notes')}</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Alocada no Tesouro Selic / CDB"
                  className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 border-border text-foreground hover:bg-secondary rounded-lg text-xs"
                >
                  {t('emergency.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 bg-[#84a98c] text-white hover:bg-[#2f3e46] dark:hover:bg-[#6b9473] rounded-lg text-xs"
                >
                  {updateMutation.isPending ? '...' : t('emergency.save')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
