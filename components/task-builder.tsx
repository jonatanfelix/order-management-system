'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Calendar, Target, User, Clock } from 'lucide-react'
import { TaskStep, OrderTask } from '@/types/task'
import { TaskGanttPreview } from './task-gantt-preview'

// Helper to skip weekends
const addWorkingDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  let workingDaysAdded = 0
  
  while (workingDaysAdded < days) {
    result.setDate(result.getDate() + 1)
    // Skip Sundays (0) - marked as "tanggal merah"
    if (result.getDay() !== 0) {
      workingDaysAdded++
    }
  }
  
  return result
}

const calculateDuration = (start: Date, end: Date): number => {
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // Count working days (exclude Sundays)
  let workingDays = 0
  const current = new Date(start)
  
  while (current <= end) {
    if (current.getDay() !== 0) { // Not Sunday
      workingDays++
    }
    current.setDate(current.getDate() + 1)
  }
  
  return workingDays
}

export default function TaskBuilder() {
  const router = useRouter()
  const [orderData, setOrderData] = useState<OrderTask>({
    title: '',
    client: '',
    category: '',
    priority: 'normal',
    tasks: [],
    totalDuration: 0,
    estimatedEndDate: new Date()
  })

  const [newTask, setNewTask] = useState<Partial<TaskStep>>({
    name: '',
    startDate: new Date(),
    endDate: addWorkingDays(new Date(), 1),
    duration: 1,
    pic: '',
    quantity: 1,
    unit: 'pcs',
    progress: 0,
    dependsOn: [],
    isMilestone: false,
    notes: ''
  })

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Update duration when dates change
  useEffect(() => {
    if (newTask.startDate && newTask.endDate) {
      const duration = calculateDuration(newTask.startDate, newTask.endDate)
      setNewTask(prev => ({ ...prev, duration }))
    }
  }, [newTask.startDate, newTask.endDate])

  // Update end date when duration changes
  const handleDurationChange = (duration: number) => {
    if (newTask.startDate) {
      const endDate = addWorkingDays(newTask.startDate, duration)
      setNewTask(prev => ({ ...prev, duration, endDate }))
    }
  }

  // Calculate dependency start date
  const calculateDependencyStartDate = (dependsOn: string[]): Date => {
    if (dependsOn.length === 0) return new Date()
    
    let latestEndDate = new Date()
    
    dependsOn.forEach(taskId => {
      const dependentTask = orderData.tasks.find(t => t.id === taskId)
      if (dependentTask && dependentTask.endDate > latestEndDate) {
        latestEndDate = dependentTask.endDate
      }
    })
    
    return addWorkingDays(latestEndDate, 1) // Start 1 working day after dependency ends
  }

  const addTask = () => {
    if (!newTask.name?.trim()) return

    const taskId = Date.now().toString()
    const startDate = newTask.dependsOn?.length 
      ? calculateDependencyStartDate(newTask.dependsOn)
      : newTask.startDate || new Date()
    
    const endDate = newTask.isMilestone 
      ? startDate 
      : addWorkingDays(startDate, newTask.duration || 1)

    const task: TaskStep = {
      id: taskId,
      name: newTask.name,
      startDate,
      endDate,
      duration: newTask.isMilestone ? 0 : (newTask.duration || 1),
      pic: newTask.pic || '',
      quantity: newTask.quantity || 1,
      unit: newTask.unit || 'pcs',
      progress: newTask.progress || 0,
      dependsOn: newTask.dependsOn || [],
      isMilestone: newTask.isMilestone || false,
      notes: newTask.notes
    }

    setOrderData(prev => ({
      ...prev,
      tasks: [...prev.tasks, task]
    }))

    // Reset form
    setNewTask({
      name: '',
      startDate: new Date(),
      endDate: addWorkingDays(new Date(), 1),
      duration: 1,
      pic: '',
      quantity: 1,
      unit: 'pcs',
      progress: 0,
      dependsOn: [],
      isMilestone: false,
      notes: ''
    })
  }

  const removeTask = (taskId: string) => {
    setOrderData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    }))
  }

  const saveOrder = async () => {
    if (!orderData.title.trim() || orderData.tasks.length === 0) {
      alert('Judul pesanan dan minimal 1 task harus diisi')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/orders/task-based', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: orderData.title,
          client: orderData.client,
          category: orderData.category,
          priority: orderData.priority,
          tasks: orderData.tasks
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save order')
      }

      alert('✅ Pesanan berhasil disimpan!')
      // Redirect to orders list
      router.push('/orders')
    } catch (error) {
      console.error('Error saving order:', error)
      alert(`❌ Gagal menyimpan pesanan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6">
      <div className="container mx-auto px-4 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Buat Pesanan Baru</h1>
            <p className="text-slate-600">Gunakan Task Builder untuk membuat pesanan dengan timeline</p>
          </div>
        </div>

      {/* Header Card */}
      <Card className="bg-white shadow-lg border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Buat Pesanan - Task Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="title">Judul Pesanan *</Label>
            <Input
              id="title"
              value={orderData.title}
              onChange={(e) => setOrderData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Nama proyek/pesanan"
            />
          </div>
          <div>
            <Label htmlFor="client">Client</Label>
            <Input
              id="client"
              value={orderData.client}
              onChange={(e) => setOrderData(prev => ({ ...prev, client: e.target.value }))}
              placeholder="Nama client"
            />
          </div>
          <div>
            <Label htmlFor="category">Kategori</Label>
            <Select value={orderData.category} onValueChange={(value) => setOrderData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="printing">Printing</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Prioritas</Label>
            <Select value={orderData.priority} onValueChange={(value: 'low' | 'normal' | 'high') => setOrderData(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Rendah</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Tinggi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Task Input Form */}
      <Card className="bg-white shadow-lg border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Tambah Task/Langkah
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="taskName">Aktivitas/Pekerjaan *</Label>
              <Input
                id="taskName"
                value={newTask.name}
                onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nama aktivitas/langkah kerja"
              />
            </div>
            <div>
              <Label htmlFor="taskPic">PIC/Penanggung Jawab</Label>
              <Input
                id="taskPic"
                value={newTask.pic}
                onChange={(e) => setNewTask(prev => ({ ...prev, pic: e.target.value }))}
                placeholder="Nama PIC"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Kuantitas</Label>
              <Input
                type="number"
                value={newTask.quantity}
                onChange={(e) => setNewTask(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                min="1"
              />
            </div>
            <div>
              <Label>Satuan</Label>
              <Input
                value={newTask.unit}
                onChange={(e) => setNewTask(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="pcs, lembar, dll"
              />
            </div>
            <div>
              <Label>Durasi (hari kerja)</Label>
              <Input
                type="number"
                value={newTask.duration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
                min="1"
                disabled={newTask.isMilestone}
              />
            </div>
            <div>
              <Label>Progress (%)</Label>
              <Slider
                value={[newTask.progress || 0]}
                onValueChange={([value]) => setNewTask(prev => ({ ...prev, progress: value }))}
                max={100}
                step={5}
                className="mt-2"
              />
              <span className="text-sm text-gray-600">{newTask.progress}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Ketergantungan (Tunggu selesai)</Label>
              <Select 
                value={newTask.dependsOn?.length ? newTask.dependsOn[0] : 'none'} 
                onValueChange={(value) => setNewTask(prev => ({ ...prev, dependsOn: value === 'none' ? [] : [value] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih task yang harus selesai dulu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {orderData.tasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newTask.isMilestone}
                onCheckedChange={(checked) => setNewTask(prev => ({ ...prev, isMilestone: checked }))}
              />
              <Label>Milestone (Titik Penting)</Label>
            </div>
          </div>

          <div>
            <Label>Catatan</Label>
            <Textarea
              value={newTask.notes}
              onChange={(e) => setNewTask(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Catatan tambahan untuk task ini"
              rows={2}
            />
          </div>

          <Button 
            onClick={addTask} 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-5 w-5 mr-2" />
            ➕ Tambah Task ke Daftar
          </Button>
        </CardContent>
      </Card>

      {/* Task List */}
      {orderData.tasks.length > 0 && (
        <Card className="bg-white shadow-lg border-2 border-slate-200">
          <CardHeader>
            <CardTitle>Daftar Task ({orderData.tasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {orderData.tasks.map((task, index) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-2 text-sm">
                    <div className="font-medium">
                      {index + 1}. {task.name}
                      {task.isMilestone && <Badge variant="outline" className="ml-2">Milestone</Badge>}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <User className="h-3 w-3" />
                      {task.pic || 'TBD'}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Target className="h-3 w-3" />
                      {task.quantity} {task.unit}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="h-3 w-3" />
                      {task.duration} hari
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="h-3 w-3" />
                      {task.startDate.toLocaleDateString('id-ID')}
                    </div>
                    <div className="text-gray-600">
                      Progress: {task.progress}%
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTask(task.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gantt Preview */}
      {orderData.tasks.length > 0 && (
        <Card className="bg-white shadow-lg border-2 border-slate-200">
          <CardHeader>
            <CardTitle>Preview Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskGanttPreview tasks={orderData.tasks} />
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button 
          variant="outline"
          onClick={() => router.back()}
          className="px-8 py-6 text-lg"
        >
          Batal
        </Button>
        <Button 
          onClick={saveOrder} 
          className="px-12 py-6 text-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all font-semibold" 
          disabled={!orderData.title.trim() || orderData.tasks.length === 0 || isSaving}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Menyimpan...
            </>
          ) : (
            <>
              💾 Simpan Pesanan
            </>
          )}
        </Button>
      </div>
      </div>
    </div>
  )
}