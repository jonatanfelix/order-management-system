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
  const [addingLoading, setAddingLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')

      if (error) throw error
      
      if (data) {
        setCategories(data)
      }
      setError(null)
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError('Gagal memuat kategori')
    } finally {
      setLoading(false)
    }
  }

  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Nama kategori tidak boleh kosong')
      return
    }

    setAddingLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .insert({ name: newCategoryName.trim() })
        .select()
        .single()

      if (error) throw error
      
      if (data) {
        setCategories([...categories, data])
        setNewCategoryName('')
        setIsAdding(false)
        onSelectCategory(data.name)
      }
    } catch (err: any) {
      console.error('Error adding category:', err)
      setError(err.message === 'duplicate key value violates unique constraint "categories_name_key"' 
        ? 'Kategori dengan nama ini sudah ada' 
        : 'Gagal menambahkan kategori')
    } finally {
      setAddingLoading(false)
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return

    setError(null)
    
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setCategories(categories.filter(c => c.id !== id))
      if (selectedCategory === categories.find(c => c.id === id)?.name) {
        onSelectCategory('')
      }
    } catch (err: any) {
      console.error('Error deleting category:', err)
      setError(err.message.includes('foreign key') 
        ? 'Tidak bisa menghapus kategori yang masih digunakan oleh order' 
        : 'Gagal menghapus kategori')
    }
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Package className="h-4 w-4" />
        Kategori
      </Label>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
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
                <Button 
                  size="sm" 
                  onClick={addCategory} 
                  className="h-8"
                  disabled={addingLoading}
                >
                  {addingLoading ? '...' : <Plus className="h-3 w-3" />}
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