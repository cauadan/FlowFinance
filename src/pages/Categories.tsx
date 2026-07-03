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
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')

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
      toast.success('Category created successfully')
      closeModal()
    },
    onError: () => toast.error('Failed to create category'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category updated successfully')
      closeModal()
    },
    onError: () => toast.error('Failed to update category'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted successfully')
    },
    onError: () => toast.error('Failed to delete category'),
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
    if (confirm('Are you sure you want to delete this category? Any transactions in this category will become uncategorized.')) {
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
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#0c0a09]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Categories
          </h1>
          <p className="text-sm text-[#78716c]">
            Organize your transactions with custom categories, icons, and colors.
          </p>
        </div>
        <div>
          <Button
            onClick={openAddModal}
            className="bg-[#84a98c] text-white hover:bg-[#2f3e46] gap-1.5 text-xs rounded-lg shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            New Category
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'EXPENSE' | 'INCOME')} className="w-full">
        <TabsList className="bg-[#f5f5f0] border border-[rgba(0,0,0,0.05)] rounded-lg p-1">
          <TabsTrigger value="EXPENSE" className="text-xs px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Expenses
          </TabsTrigger>
          <TabsTrigger value="INCOME" className="text-xs px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Income
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
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Category Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-[rgba(0,0,0,0.05)]"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(0,0,0,0.05)] mb-4">
              <h3 className="text-lg font-medium text-[#0c0a09]">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <Button variant="ghost" size="icon" onClick={closeModal} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Name */}
              <div className="space-y-1.5">
                <Label htmlFor="catName" className="text-xs uppercase tracking-wider text-[#78716c]">Name</Label>
                <Input
                  id="catName"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g., Groceries, Freelance"
                  required
                  className="border-[rgba(0,0,0,0.1)] focus-visible:ring-[#84a98c]"
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-[#78716c]">Color</Label>
                <div className="flex flex-wrap gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className="h-8 w-8 rounded-full border border-[rgba(0,0,0,0.08)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
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
                <Label className="text-xs uppercase tracking-wider text-[#78716c]">Icon</Label>
                <div className="grid grid-cols-7 gap-2 max-h-[150px] overflow-y-auto p-1 border rounded-lg bg-[#fafaf5]/40 border-[rgba(0,0,0,0.08)]">
                  {Object.entries(iconMap).map(([iconName, IconComponent]) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`h-9 w-9 rounded-md flex items-center justify-center transition-all ${
                        selectedIcon === iconName
                          ? 'bg-[#84a98c] text-white'
                          : 'bg-white border border-[rgba(0,0,0,0.08)] text-stone-500 hover:bg-[#fafaf5]'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-[rgba(0,0,0,0.05)]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1 border-[rgba(0,0,0,0.1)] rounded-lg text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-[#84a98c] text-white hover:bg-[#2f3e46] rounded-lg text-xs"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
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
}

function CategoryGrid({ categories, onEdit, onDelete }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-[rgba(0,0,0,0.08)] rounded-xl bg-white">
        <Tags className="h-8 w-8 text-[#a8a29e] mb-2" />
        <p className="text-sm font-medium text-[#78716c]">No categories found. Create a new one to begin!</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((cat) => {
        const IconComponent = iconMap[cat.icon] || Circle
        return (
          <Card key={cat.id} className="border-[rgba(0,0,0,0.05)] bg-white shadow-sm overflow-hidden group">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: cat.color }}
                >
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-[#0c0a09]">{cat.name}</h4>
                  <span className="text-[10px] text-stone-400">
                    {cat.isDefault ? 'Default Category' : 'Custom'}
                  </span>
                </div>
              </div>

              {!cat.isDefault && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-stone-500"
                    onClick={() => onEdit(cat)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-red-500 hover:text-red-600"
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
