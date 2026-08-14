import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Plus,
  Edit2,
  Trash2,
  Tags,
  Check,
  Circle,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Heart,
  Plug,
  BookOpen,
  Tv,
  Gamepad,
  Briefcase,
  Gift,
  Layers,
  DollarSign,
  TrendingUp,
  PiggyBank,
  User,
  Scissors,
  Shield,
  Coffee,
  Wrench,
  X,
} from 'lucide-react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api'
import type { Category } from '@/lib/api'
import { useSettings } from '@/contexts/SettingsContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

// Icon mapping to Lucide React components
const iconMap: Record<string, any> = {
  circle: Circle,
  'shopping-bag': ShoppingBag,
  utensils: Utensils,
  car: Car,
  home: Home,
  heart: Heart,
  plug: Plug,
  'book-open': BookOpen,
  tv: Tv,
  gamepad: Gamepad,
  briefcase: Briefcase,
  gift: Gift,
  layers: Layers,
  'dollar-sign': DollarSign,
  'trending-up': TrendingUp,
  'piggy-bank': PiggyBank,
  user: User,
  scissors: Scissors,
  shield: Shield,
  coffee: Coffee,
  wrench: Wrench,
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
  '#6b7280', // Gray
]

export default function Categories() {
  const queryClient = useQueryClient()
  const { t } = useSettings()
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')

  const translateDbItem = (name: string, type: 'category' | 'payment') => {
    const key = `${type}.${name.toLowerCase()}`
    const translated = t(key)
    return translated !== key ? translated : name
  }

  // Form State
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [selectedColor, setSelectedColor] = useState('#84a98c')
  const [selectedIcon, setSelectedIcon] = useState('circle')

  // Queries
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(t('categories.create_success'))
      closeModal()
    },
    onError: () => toast.error(t('categories.create_error')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(t('categories.update_success'))
      closeModal()
    },
    onError: () => toast.error(t('categories.update_error')),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(t('categories.delete_success'))
    },
    onError: () => toast.error(t('categories.delete_error')),
  })

  const openAddModal = () => {
    setEditingCategory(null)
    setCategoryName('')
    setSelectedColor('#84a98c')
    setSelectedIcon('circle')
    setShowModal(true)
  }

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat)
    setCategoryName(cat.name)
    setSelectedColor(cat.color)
    setSelectedIcon(cat.icon)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setCategoryName('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryName.trim()) return

    const data: Partial<Category> = {
      name: categoryName.trim(),
      color: selectedColor,
      icon: selectedIcon,
      type: activeTab,
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id: number) => {
    if (confirm(t('categories.delete_confirm'))) {
      deleteMutation.mutate(id)
    }
  }

  const filteredCategories = categories?.filter((c) => c.type === activeTab) || []

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
            {t('categories.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('categories.subtitle')}
          </p>
        </div>
        <div>
          <Button
            onClick={openAddModal}
            className="rounded-full bg-[#84a98c] text-white hover:bg-[#2f3e46] dark:hover:bg-[#6b9473] gap-1.5 shadow-sm text-sm"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span>{t('categories.new')}</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'EXPENSE' | 'INCOME')} className="w-full">
        <TabsList className="bg-secondary/70 dark:bg-[#1b1f27] border border-border rounded-xl p-1">
          <TabsTrigger value="EXPENSE" className="text-xs px-4 py-2 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground">
            {t('categories.tab_expense')}
          </TabsTrigger>
          <TabsTrigger value="INCOME" className="text-xs px-4 py-2 rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs text-muted-foreground">
            {t('categories.tab_income')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="EXPENSE" className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <CategoryGrid
              categories={filteredCategories}
              onEdit={openEditModal}
              onDelete={handleDelete}
              t={t}
              translateDbItem={translateDbItem}
            />
          )}
        </TabsContent>

        <TabsContent value="INCOME" className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <CategoryGrid
              categories={filteredCategories}
              onEdit={openEditModal}
              onDelete={handleDelete}
              t={t}
              translateDbItem={translateDbItem}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Category Add/Edit Modal */}
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
                {editingCategory ? t('categories.modal_edit') : t('categories.modal_new')}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Name */}
              <div className="space-y-1.5">
                <Label htmlFor="catName" className="text-xs uppercase tracking-wider text-muted-foreground">{t('categories.name')}</Label>
                <Input
                  id="catName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder={t('categories.name_placeholder')}
                  required
                  className="border-border bg-card dark:bg-[#1b1f27] text-foreground focus-visible:ring-[#84a98c]"
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t('categories.color')}</Label>
                <div className="flex flex-wrap gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className="h-8 w-8 rounded-full border border-border flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-xs"
                      style={{ backgroundColor: color }}
                    >
                      {selectedColor === color && (
                        <Check className="h-4 w-4 text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Picker */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t('categories.icon')}</Label>
                <div className="grid grid-cols-7 gap-2 max-h-[150px] overflow-y-auto p-1.5 border rounded-xl bg-secondary/50 dark:bg-[#1b1f27] border-border">
                  {Object.entries(iconMap).map(([iconName, IconComponent]) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`h-9 w-9 rounded-md flex items-center justify-center transition-all ${
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
                  onClick={closeModal}
                  className="flex-1 border-border text-foreground hover:bg-secondary rounded-lg text-xs"
                >
                  {t('categories.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-[#84a98c] text-white hover:bg-[#2f3e46] dark:hover:bg-[#6b9473] rounded-lg text-xs"
                >
                  {createMutation.isPending || updateMutation.isPending ? t('categories.saving') : t('categories.save')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

interface CategoryGridProps {
  categories: Category[]
  onEdit: (cat: Category) => void
  onDelete: (id: number) => void
  t: (key: string) => string
  translateDbItem: (name: string, type: 'category' | 'payment') => string
}

function CategoryGrid({ categories, onEdit, onDelete, t, translateDbItem }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl bg-card">
        <Tags className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium text-muted-foreground">{t('categories.no_data')}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((cat) => {
        const IconComponent = iconMap[cat.icon] || Circle
        return (
          <Card key={cat.id} className="border-border bg-card shadow-sm overflow-hidden group hover:border-[#84a98c]/30 transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: cat.color }}
                >
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    {cat.isDefault ? translateDbItem(cat.name, 'category') : cat.name}
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    {cat.isDefault ? t('categories.default') : t('categories.custom')}
                  </span>
                </div>
              </div>

              {!cat.isDefault && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(cat)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => onDelete(cat.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
