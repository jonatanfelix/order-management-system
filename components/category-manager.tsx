'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, Package } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Badge } from '@/components/ui/badge'

interface Category {
  id: string
  name: string
}

interface CategoryManagerProps {
  selectedCategory?: string
  onSelectCategory: (category: string) => void
}

export function CategoryManager({ selectedCategory, onSelectCategory }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name')

    if (!error && data) {
      setCategories(data)
    }
    setLoading(false)
  }

  const addCategory = async () => {
    if (!newCategoryName.trim()) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: newCategoryName.trim() })
      .select()
      .single()

    if (!error && data) {
      setCategories([...categories, data])
      setNewCategoryName('')
      setIsAdding(false)
      onSelectCategory(data.name)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (!error) {
      setCategories(categories.filter(c => c.id !== id))
      if (selectedCategory === categories.find(c => c.id === id)?.name) {
        onSelectCategory('')
      }
    }
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Package className="h-4 w-4" />
        Kategori
      </Label>
      
      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {loading ? (
          <div className="text-sm text-slate-500">Memuat...</div>
        ) : (
          <>
            {categories.map((category) => (
              <div key={category.id} className="relative group">
                <Badge
                  variant={selectedCategory === category.name ? 'default' : 'outline'}
                  className="cursor-pointer pr-7 hover:shadow-md transition-all"
                  onClick={() => onSelectCategory(category.name)}
                >
                  {category.name}
                </Badge>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteCategory(category.id)
                  }}
                  className="absolute -right-1 -top-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Hapus kategori"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            
            {/* Add new category */}
            {isAdding ? (
              <div className="flex gap-2 items-center">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nama kategori baru"
                  className="h-8 w-40"
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                  autoFocus
                />
                <Button size="sm" onClick={addCategory} className="h-8">
                  <Plus className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setIsAdding(false)
                    setNewCategoryName('')
                  }}
                  className="h-8"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAdding(true)}
                className="h-7 gap-1"
              >
                <Plus className="h-3 w-3" />
                Tambah Kategori
              </Button>
            )}
          </>
        )}
      </div>
      
      {selectedCategory && (
        <div className="text-xs text-slate-600">
          Kategori terpilih: <span className="font-semibold">{selectedCategory}</span>
        </div>
      )}
    </div>
  )
}