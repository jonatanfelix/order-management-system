'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { PicSelector } from '@/components/pic-selector'
import Link from 'next/link'
import { ArrowLeftIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

interface OrderEditFormProps {
  order: any
  tasks: any[]
  categories: any[]
  templates: any[]
}

export default function OrderEditForm({ order, tasks, categories, templates }: OrderEditFormProps) {
  const router = useRouter()
  const [orderData, setOrderData] = useState({
    title: order.title || '',
    client_name: order.client_name || '',
    value_idr: order.value_idr || 0,
    category_id: order.category_id || '',
    template_id: order.template_id || '',
  })

  const [tasksList, setTasksList] = useState(tasks || [])
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Update order basic info
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderData,
          tasks: tasksList
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update order')
      }

      router.push(`/orders/${order.id}?success=updated`)
      router.refresh()
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Gagal menyimpan perubahan')
    } finally {
      setIsSaving(false)
    }
  }

  const updateTask = (index: number, field: string, value: any) => {
    const updated = [...tasksList]
    updated[index] = { ...updated[index], [field]: value }
    setTasksList(updated)
  }

  const deleteTask = (index: number) => {
    if (confirm('Hapus task ini?')) {
      setTasksList(tasksList.filter((_, i) => i !== index))
    }
  }

  const addTask = () => {
    setTasksList([...tasksList, {
      name: '',
      pic: '',
      duration_days: 1,
      progress: 0,
      task_order: tasksList.length
    }])
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href={`/orders/${order.id}`}>
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                ✏️ Edit Order: {order.title}
              </h1>
              <p className="text-slate-600">Update order details and tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Order Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>
              Update the basic order information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Order Title *</Label>
              <Input
                id="title"
                value={orderData.title}
                onChange={(e) => setOrderData({...orderData, title: e.target.value})}
                required
                placeholder="e.g., Project Alpha - Website Redesign"
              />
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                value={orderData.client_name}
                onChange={(e) => setOrderData({...orderData, client_name: e.target.value})}
                required
                placeholder="e.g., PT ABC Corporation"
              />
            </div>

            {/* Value IDR */}
            <div className="space-y-2">
              <Label htmlFor="value_idr">Order Value (IDR) *</Label>
              <Input
                id="value_idr"
                type="number"
                step="1000"
                value={orderData.value_idr || 0}
                onChange={(e) => setOrderData({...orderData, value_idr: parseInt(e.target.value) || 0})}
                required
                placeholder="e.g., 10000000"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category_id">Category *</Label>
                <Select 
                  value={orderData.category_id} 
                  onValueChange={(value) => setOrderData({...orderData, category_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template */}
              <div className="space-y-2">
                <Label htmlFor="template_id">Template *</Label>
                <Select 
                  value={orderData.template_id} 
                  onValueChange={(value) => setOrderData({...orderData, template_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template: any) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        {tasksList.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>
                    Edit existing tasks or add new ones
                  </CardDescription>
                </div>
                <Button type="button" size="sm" onClick={addTask}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasksList.map((task, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900">Task {index + 1}</h4>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteTask(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Task Name */}
                    <div className="space-y-2">
                      <Label>Task Name *</Label>
                      <Input
                        value={task.name || ''}
                        onChange={(e) => updateTask(index, 'name', e.target.value)}
                        required
                        placeholder="e.g., Design mockups"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* PIC */}
                      <PicSelector
                        value={task.pic || ''}
                        onChange={(pic) => updateTask(index, 'pic', pic)}
                        label="PIC"
                      />

                      {/* Duration */}
                      <div className="space-y-2">
                        <Label>Duration (days)</Label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={task.duration_days || 1}
                          onChange={(e) => updateTask(index, 'duration_days', parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <Label>Progress: {task.progress || 0}%</Label>
                      <Slider
                        value={[task.progress || 0]}
                        onValueChange={([value]) => updateTask(index, 'progress', value)}
                        max={100}
                        step={5}
                      />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Input
                        value={task.notes || ''}
                        onChange={(e) => updateTask(index, 'notes', e.target.value)}
                        placeholder="Additional notes..."
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={isSaving}>
            {isSaving ? 'Saving...' : '💾 Save All Changes'}
          </Button>
          <Button type="button" variant="outline" asChild className="flex-1">
            <Link href={`/orders/${order.id}`}>
              Cancel
            </Link>
          </Button>
        </div>
      </form>
    </div>
  )
}