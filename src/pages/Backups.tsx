import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Database,
  Plus,
  RefreshCw,
  AlertTriangle,
  Clock,
  HardDrive,
  X,
} from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'
import { getBackups, createBackup, restoreBackup } from '@/lib/api'
import type { Backup } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export default function Backups() {
  const queryClient = useQueryClient()
  const { t } = useSettings()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)

  // Queries
  const { data: backups, isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: getBackups,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] })
      toast.success(t('backups.create_success'))
    },
    onError: () => toast.error(t('backups.create_error')),
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreBackup(id),
    onSuccess: (data) => {
      // Invalidate ALL queries to refresh frontend with restored data
      queryClient.invalidateQueries()
      toast.success(data.message || t('backups.restore_success'))
      closeConfirmModal()
    },
    onError: () => toast.error(t('backups.restore_error')),
  })

  const handleCreate = () => {
    createMutation.mutate()
  }

  const openConfirmModal = (backup: Backup) => {
    setSelectedBackup(backup)
    setShowConfirmModal(true)
  }

  const closeConfirmModal = () => {
    setSelectedBackup(null)
    setShowConfirmModal(false)
  }

  const handleRestore = () => {
    if (selectedBackup) {
      restoreMutation.mutate(selectedBackup.id)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
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
            {t('backups.title')}
          </h1>
          <p className="text-sm text-[#78716c]">
            {t('backups.subtitle')}
          </p>
        </div>
        <div>
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="bg-[#84a98c] text-white hover:bg-[#2f3e46] gap-1.5 text-xs rounded-lg shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            {createMutation.isPending ? t('backups.creating') : t('backups.create')}
          </Button>
        </div>
      </div>

      {/* Safety Notice */}
      <Card className="border-amber-100 bg-amber-50/50 shadow-sm">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Safety Warning</h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              Restoring a backup will overwrite all current transactions, categories, budgets, and investments.
              A safety snapshot of your current database will automatically be created before any restore operation begins.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backups List */}
      <Card className="border-[rgba(0,0,0,0.05)] bg-white shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#0c0a09]">Available Backups</CardTitle>
          <CardDescription className="text-xs text-[#a8a29e]">Manage local database snapshot archives</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : backups && backups.length > 0 ? (
            <div className="divide-y divide-[rgba(0,0,0,0.04)] px-6 pb-6">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-[#a8a29e]">
                      <Database className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#0c0a09] truncate max-w-xs md:max-w-md">
                        {backup.filename}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-[#a8a29e]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(backup.createdAt.split('T')[0])} {backup.createdAt.split('T')[1].slice(0, 5)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3.5 w-3.5" />
                          {formatSize(backup.size)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Button
                      onClick={() => openConfirmModal(backup)}
                      variant="outline"
                      className="border-[rgba(0,0,0,0.1)] hover:bg-[#84a98c] hover:text-white gap-1.5 text-xs rounded-lg"
                      size="sm"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t('backups.restore')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Database className="h-8 w-8 text-[#a8a29e] mb-2" />
              <p className="text-sm text-[#a8a29e]">{t('backups.no_data')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Restore Modal */}
      {showConfirmModal && selectedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeConfirmModal} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-[rgba(0,0,0,0.05)]"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(0,0,0,0.05)] mb-4">
              <h3 className="text-lg font-medium text-[#0c0a09]">{t('backups.restore')}</h3>
              <Button variant="ghost" size="icon" onClick={closeConfirmModal} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
                <div className="text-xs leading-relaxed font-medium">
                  {t('backups.restore_confirm')}
                  <span className="block mt-1 font-mono text-[10px] font-semibold text-red-800 break-all">
                    {selectedBackup.filename}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-[rgba(0,0,0,0.05)]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeConfirmModal}
                  className="flex-1 border-[rgba(0,0,0,0.1)] rounded-lg text-xs"
                >
                  {t('budgets.cancel')}
                </Button>
                <Button
                  onClick={handleRestore}
                  disabled={restoreMutation.isPending}
                  className="flex-1 bg-red-500 text-white hover:bg-red-600 rounded-lg text-xs"
                >
                  {restoreMutation.isPending ? '...' : t('backups.restore')}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
