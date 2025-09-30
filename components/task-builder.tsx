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
import { Plus, Trash2, Calendar, Target, User, Clock, Edit2, Save, X, AlertCircle } from 'lucide-react'
import { TaskStep, OrderTask } from '@/types/task'
import { GoogleCalendarTimeline } from './google-calendar-timeline'
import { CategoryManager } from './category-manager'
import { PicSelector } from './pic-selector'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

export default function TaskBuilderV2() {
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
    target: '',
    progress: 0,
    dependsOn: [],
    isMilestone: false,
    notes: ''
  })

  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editTaskData, setEditTaskData] = useState<Partial<TaskStep> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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
    if (!newTask.name?.trim()) {
      alert('Nama task harus diisi!')
      return
    }

    // Use temporary ID for frontend (will be replaced with UUID from database)
    const taskId = `temp-${Date.now()}`
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
      target: newTask.target || '',
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
      target: '',
      progress: 0,
      dependsOn: [],
      isMilestone: false,
      notes: ''
    })
  }

  const startEditTask = (task: TaskStep) => {
    setEditingTask(task.id)
    setEditTaskData({
      name: task.name,
      pic: task.pic,
      quantity: task.quantity,
      unit: task.unit,
      duration: task.duration,
      progress: task.progress,
      isMilestone: task.isMilestone,
      notes: task.notes,
      startDate: task.startDate,
      endDate: task.endDate,
      dependsOn: task.dependsOn
    })
  }

  const saveEditTask = () => {
    if (!editingTask || !editTaskData) return

    setOrderData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => {
        if (task.id === editingTask) {
          const startDate = editTaskData.startDate || task.startDate
          const endDate = editTaskData.isMilestone 
            ? startDate 
            : addWorkingDays(startDate, editTaskData.duration || 1)

          return {
            ...task,
            name: editTaskData.name || task.name,
            pic: editTaskData.pic || '',
            quantity: editTaskData.quantity || task.quantity,
            unit: editTaskData.unit || task.unit,
            duration: editTaskData.isMilestone ? 0 : (editTaskData.duration || task.duration),
            progress: editTaskData.progress ?? task.progress,
            isMilestone: editTaskData.isMilestone ?? task.isMilestone,
            notes: editTaskData.notes,
            startDate,
            endDate
          }
        }
        return task
      })
    }))

    cancelEditTask()
  }

  const cancelEditTask = () => {
    setEditingTask(null)
    setEditTaskData(null)
  }

  const removeTask = (taskId: string) => {
    if (!confirm('Hapus task ini?')) return
    
    setOrderData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    }))
  }

  const saveOrder = async () => {
    console.log('🚀 saveOrder called')
    console.log('Order Data:', orderData)

    setSaveError(null)

    // Validation
    if (!orderData.title.trim()) {
      setSaveError('Judul pesanan harus diisi!')
      alert('❌ Judul pesanan harus diisi!')
      return
    }

    if (orderData.tasks.length === 0) {
      setSaveError('Minimal 1 task harus ditambahkan!')
      alert('❌ Minimal 1 task harus ditambahkan!')
      return
    }

    setIsSaving(true)

    try {
      console.log('📤 Sending request to API...')
      
      const payload = {
        title: orderData.title,
        client: orderData.client || '',
        category: orderData.category || '',
        priority: orderData.priority,
        tasks: orderData.tasks.map(task => ({
          name: task.name,
          pic: task.pic,
          quantity: task.quantity,
          unit: task.unit,
          target: task.target || '',
          startDate: task.startDate.toISOString(),
          endDate: task.endDate.toISOString(),
          duration: task.duration,
          progress: task.progress,
          isMilestone: task.isMilestone,
          dependsOn: task.dependsOn,
          notes: task.notes || ''
        }))
      }

      console.log('📦 Payload:', JSON.stringify(payload, null, 2))

      const response = await fetch('/api/orders/task-based', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      console.log('📥 Response status:', response.status)

      const result = await response.json()
      console.log('📥 Response body:', result)

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}: Failed to save order`)
      }

      console.log('✅ Order saved successfully!')
      alert(`✅ Pesanan "${orderData.title}" berhasil disimpan!\n\nOrder ID: ${result.orderId}`)
      
      // Redirect to orders list
      router.push('/orders')
    } catch (error) {
      console.error('❌ Error saving order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setSaveError(errorMessage)
      alert(`❌ Gagal menyimpan pesanan!\n\nError: ${errorMessage}\n\nSilakan cek console untuk detail.`)
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

        {/* Error Alert */}
        {saveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

      {/* Header Card */}
      <Card className="bg-white shadow-lg border-2 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Buat Pesanan - Task Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Judul Pesanan *</Label>
            <Input
              id="title"
              value={orderData.title}
              onChange={(e) => setOrderData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Nama proyek/pesanan"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="client">Client</Label>
            <Input
              id="client"
              value={orderData.client}
              onChange={(e) => setOrderData(prev => ({ ...prev, client: e.target.value }))}
              placeholder="Nama client"
              className="mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <CategoryManager
              selectedCategory={orderData.category}
              onSelectCategory={(category) => {
                console.log('Category selected:', category)
                setOrderData(prev => ({ ...prev, category }))
              }}
            />
          </div>
          <div>
            <Label htmlFor="priority">Prioritas</Label>
            <Select value={orderData.priority} onValueChange={(value: 'low' | 'normal' | 'high') => setOrderData(prev => ({ ...prev, priority: value }))}>
              <SelectTrigger className="mt-1">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="taskName">Aktivitas/Pekerjaan *</Label>
              <Input
                id="taskName"
                value={newTask.name}
                onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nama aktivitas/langkah kerja"
                className="mt-1"
              />
            </div>
            <PicSelector
              value={newTask.pic}
              onChange={(pic) => setNewTask(prev => ({ ...prev, pic }))}
            />
            <div>
              <Label>Durasi (hari kerja) - Max 999 hari</Label>
              <Input
                type="number"
                value={newTask.duration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
                min="1"
                max="999"
                step="1"
                disabled={newTask.isMilestone}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Kuantitas</Label>
              <Input
                type="number"
                value={newTask.quantity}
                onChange={(e) => setNewTask(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                min="1"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Satuan</Label>
              <Input
                value={newTask.unit}
                onChange={(e) => setNewTask(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="pcs, lembar, dll"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>🎯 Target Realisasi Kerja</Label>
              <Input
                value={newTask.target}
                onChange={(e) => setNewTask(prev => ({ ...prev, target: e.target.value }))}
                placeholder="Contoh: 20 rim, 1 kali 200 rim, sesuai plate selesai"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Target output atau hasil yang diharapkan</p>
            </div>
          </div>
          
          <div>
            <Label>Progress (%): {newTask.progress}%</Label>
            <Slider
              value={[newTask.progress || 0]}
              onValueChange={([value]) => setNewTask(prev => ({ ...prev, progress: value }))}
              max={100}
              step={5}
              className="mt-3"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Ketergantungan (Tunggu selesai)</Label>
              <Select 
                value={newTask.dependsOn?.length ? newTask.dependsOn[0] : 'none'} 
                onValueChange={(value) => setNewTask(prev => ({ ...prev, dependsOn: value === 'none' ? [] : [value] }))}
              >
                <SelectTrigger className="mt-1">
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
            <div className="flex items-center space-x-2 mt-6">
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
              className="mt-1"
            />
          </div>

          <Button 
            onClick={addTask} 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
            type="button"
          >
            <Plus className="h-5 w-5 mr-2" />
            ➕ Tambah Task ke Daftar
          </Button>
        </CardContent>
      </Card>

      {/* Task List with Edit */}
      {orderData.tasks.length > 0 && (
        <Card className="bg-white shadow-lg border-2 border-slate-200">
          <CardHeader>
            <CardTitle>Daftar Task ({orderData.tasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderData.tasks.map((task, index) => (
                <div key={task.id} className="border rounded-lg p-4">
                  {editingTask === task.id ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <Input
                        value={editTaskData?.name}
                        onChange={(e) => setEditTaskData(prev => prev ? { ...prev, name: e.target.value } : null)}
                        placeholder="Nama task"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={editTaskData?.pic}
                          onChange={(e) => setEditTaskData(prev => prev ? { ...prev, pic: e.target.value } : null)}
                          placeholder="PIC"
                        />
                        <Input
                          type="number"
                          value={editTaskData?.duration}
                          onChange={(e) => setEditTaskData(prev => prev ? { ...prev, duration: parseInt(e.target.value) } : null)}
                          placeholder="Durasi"
                          min="1"
                          max="999"
                        />
                        <Input
                          type="number"
                          value={editTaskData?.progress}
                          onChange={(e) => setEditTaskData(prev => prev ? { ...prev, progress: parseInt(e.target.value) } : null)}
                          placeholder="Progress %"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveEditTask} size="sm" className="gap-1">
                          <Save className="h-3 w-3" />
                          Simpan
                        </Button>
                        <Button onClick={cancelEditTask} variant="outline" size="sm" className="gap-1">
                          <X className="h-3 w-3" />
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-slate-700">{index + 1}.</span>
                          <span className="font-bold text-slate-900">{task.name}</span>
                          {task.isMilestone && <Badge variant="outline" className="text-yellow-600">🎯 Milestone</Badge>}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.pic || 'TBD'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.duration} hari
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {task.startDate.toLocaleDateString('id-ID')}
                          </div>
                          <div>
                            Progress: {task.progress}%
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditTask(task)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTask(task.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Google Calendar Preview */}
      {orderData.tasks.length > 0 && (
        <Card className="bg-white shadow-lg border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              📅 Google Calendar Timeline Preview
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              View: Bulan / Minggu / Agenda - Task bars otomatis span across dates
            </p>
          </CardHeader>
          <CardContent>
            <GoogleCalendarTimeline tasks={orderData.tasks} />
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-4 sticky bottom-4 bg-white p-4 rounded-lg shadow-xl border-2 border-slate-200">
        <Button 
          variant="outline"
          onClick={() => router.back()}
          className="px-8 py-6 text-lg"
          disabled={isSaving}
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