'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PlusIcon, TrashIcon, PrinterIcon, ShareIcon } from '@heroicons/react/24/outline'

interface ProcessStep {
  id: number
  name: string
  pic: string
  target: string
  months: number[]
}

export default function GuestGanttPage() {
  const [projectTitle, setProjectTitle] = useState('PROYEK PENGERJAAN BUKU TULIS')
  const [clientName, setClientName] = useState('PT. Contoh Client')
  const [projectDescription, setProjectDescription] = useState('Cetak buku tulis 100 halaman')
  
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([
    { 
      id: 1, 
      name: 'PESAN BAHAN', 
      pic: 'IBU MEINI',
      target: '20 rim',
      months: [1, 2] 
    },
    { 
      id: 2, 
      name: 'POTONG BAHAN', 
      pic: 'PAK ZUL',
      target: '1 kali 200 rim',
      months: [2, 3]  
    },
    { 
      id: 3, 
      name: 'PROSES PEMBUATAN PLATE', 
      pic: 'LASPEN',
      target: 'sesuai plate selesai',
      months: [2] 
    },
  ])

  // Generate 12 months timeline
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() + i)
    return {
      month: i + 1,
      label: date.toLocaleDateString('id-ID', { month: 'short' }),
      fullDate: date
    }
  })

  const addStep = () => {
    const newId = Math.max(...processSteps.map(s => s.id)) + 1
    setProcessSteps([...processSteps, {
      id: newId,
      name: '',
      pic: '',
      target: '',
      months: []
    }])
  }

  const updateStep = (id: number, field: keyof ProcessStep, value: any) => {
    setProcessSteps(steps => 
      steps.map(step => 
        step.id === id ? { ...step, [field]: value } : step
      )
    )
  }

  const deleteStep = (id: number) => {
    setProcessSteps(steps => steps.filter(step => step.id !== id))
  }

  const toggleMonth = (stepId: number, month: number) => {
    setProcessSteps(steps => 
      steps.map(step => {
        if (step.id === stepId) {
          const months = step.months.includes(month)
            ? step.months.filter(m => m !== month)
            : [...step.months, month].sort((a, b) => a - b)
          return { ...step, months }
        }
        return step
      })
    )
  }

  const getStepColor = (stepName: string) => {
    if (stepName.includes('BAHAN')) return 'bg-red-500'
    if (stepName.includes('CETAK')) return 'bg-green-500'  
    if (stepName.includes('SUSUN')) return 'bg-blue-500'
    if (stepName.includes('JAHIT')) return 'bg-blue-400'
    if (stepName.includes('POTONG')) return 'bg-yellow-500'
    if (stepName.includes('SORTIR')) return 'bg-purple-500'
    if (stepName.includes('KIRIM')) return 'bg-red-400'
    return 'bg-gray-400'
  }

  const exportToImage = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                📊 Gantt Chart Generator (Guest Mode)
              </h1>
              <p className="text-sm text-slate-600">
                Buat timeline proyek tanpa perlu login
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={exportToImage}>
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print / Export
              </Button>
              <Button size="sm" variant="outline">
                <ShareIcon className="h-4 w-4 mr-2" />
                Share Link
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Project Info Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📋 Informasi Proyek</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="title">Judul Proyek</Label>
                <Input
                  id="title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Masukkan judul proyek..."
                />
              </div>
              <div>
                <Label htmlFor="client">Nama Client</Label>
                <Input
                  id="client"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nama client..."
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Deskripsi singkat..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Process Steps Form */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>🛠️ Daftar Proses Kerja</CardTitle>
              <Button onClick={addStep} size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Tambah Step
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processSteps.map((step, index) => (
                <div key={step.id} className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline">Step {index + 1}</Badge>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => deleteStep(step.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Jenis Pekerjaan</Label>
                      <Input
                        value={step.name}
                        onChange={(e) => updateStep(step.id, 'name', e.target.value)}
                        placeholder="Contoh: PESAN BAHAN"
                      />
                    </div>
                    <div>
                      <Label>Penanggung Jawab</Label>
                      <Input
                        value={step.pic}
                        onChange={(e) => updateStep(step.id, 'pic', e.target.value)}
                        placeholder="Nama PIC"
                      />
                    </div>
                    <div>
                      <Label>Target Realisasi</Label>
                      <Input
                        value={step.target}
                        onChange={(e) => updateStep(step.id, 'target', e.target.value)}
                        placeholder="Target/jumlah"
                      />
                    </div>
                  </div>
                  
                  {/* Month Selection */}
                  <div className="mt-4">
                    <Label>Pilih Bulan Aktif:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {months.map((month) => (
                        <button
                          key={month.month}
                          type="button"
                          className={`px-3 py-1 text-xs rounded border ${
                            step.months.includes(month.month)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                          onClick={() => toggleMonth(step.id, month.month)}
                        >
                          {month.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gantt Chart Preview */}
        <Card className="w-full min-w-[1200px] overflow-x-auto">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl">
              📋 {projectTitle}
            </CardTitle>
            <div className="text-center text-sm text-slate-600">
              Target Realisasi Kerja - {clientName}
            </div>
          </CardHeader>
          <CardContent>
            {/* Header Table */}
            <div className="grid grid-cols-[50px_250px_150px_180px_repeat(12,_80px)] gap-1 mb-2">
              <div className="bg-yellow-200 border-2 border-black p-2 text-xs font-bold">No</div>
              <div className="bg-yellow-200 border-2 border-black p-2 text-xs font-bold">JENIS PEKERJAAN</div>
              <div className="bg-yellow-200 border-2 border-black p-2 text-xs font-bold">PENANGGUNG JAWAB</div>
              <div className="bg-yellow-200 border-2 border-black p-2 text-xs font-bold">TARGET REALISASI KERJA</div>
              <div className="col-span-12 grid grid-cols-12 gap-1">
                {months.map((month) => (
                  <div key={month.month} className="bg-yellow-200 border-2 border-black p-2 text-xs font-bold text-center">
                    {month.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Process Rows */}
            {processSteps.map((step, index) => (
              <div key={step.id} className="grid grid-cols-[50px_250px_150px_180px_repeat(12,_80px)] gap-1 mb-1">
                <div className="border-2 border-black p-2 text-xs text-center bg-white font-semibold">
                  {index + 1}
                </div>
                <div className="border-2 border-black p-2 text-xs font-medium bg-white">
                  {step.name || 'Belum diisi'}
                </div>
                <div className="border-2 border-black p-2 text-xs text-center bg-white">
                  {step.pic || '-'}
                </div>
                <div className="border-2 border-black p-2 text-xs bg-white">
                  {step.target || '-'}
                </div>
                
                {/* Timeline Cells */}
                <div className="col-span-12 grid grid-cols-12 gap-1">
                  {months.map((month) => {
                    const isActive = step.months.includes(month.month)
                    return (
                      <div 
                        key={`${step.id}-${month.month}`} 
                        className={`border-2 border-black h-8 ${
                          isActive ? getStepColor(step.name) : 'bg-white'
                        }`}
                      />
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Add empty rows for better formatting */}
            {Array.from({ length: Math.max(0, 12 - processSteps.length) }).map((_, index) => (
              <div key={`empty-${index}`} className="grid grid-cols-[50px_250px_150px_180px_repeat(12,_80px)] gap-1 mb-1">
                <div className="border-2 border-black p-2 text-xs text-center bg-white h-8"></div>
                <div className="border-2 border-black p-2 text-xs bg-white h-8"></div>
                <div className="border-2 border-black p-2 text-xs bg-white h-8"></div>
                <div className="border-2 border-black p-2 text-xs bg-white h-8"></div>
                <div className="col-span-12 grid grid-cols-12 gap-1">
                  {months.map((month) => (
                    <div key={`empty-${index}-${month.month}`} className="border-2 border-black h-8 bg-white" />
                  ))}
                </div>
              </div>
            ))}

            {/* Footer with dates */}
            <div className="grid grid-cols-[50px_250px_150px_180px_repeat(12,_80px)] gap-1 mt-4 pt-4 border-t-4 border-black">
              <div className="col-span-4"></div>
              <div className="col-span-12 grid grid-cols-12 gap-1">
                {months.map((month) => (
                  <div key={month.month} className="text-xs text-center font-semibold">
                    {month.fullDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-8 p-4 bg-slate-100 rounded-lg">
              <h4 className="font-semibold mb-3">🎨 Keterangan Warna:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 border"></div>
                  <span>Persiapan Bahan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 border"></div>
                  <span>Proses Cetak</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 border"></div>
                  <span>Assembly/Susun</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 border"></div>
                  <span>Finishing</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                💡 Tip: Warna otomatis berdasarkan nama pekerjaan. Klik bulan untuk mengatur timeline.
              </p>
            </div>

            {/* Project Summary */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm bg-white p-4 rounded border">
              <div>
                <h4 className="font-semibold text-slate-800">📋 Info Proyek:</h4>
                <p className="text-slate-600">{projectDescription}</p>
                <p className="text-slate-500">Total Steps: {processSteps.length}</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">👤 Client:</h4>
                <p className="text-slate-600">{clientName}</p>
                <p className="text-slate-500">Dibuat: {new Date().toLocaleDateString('id-ID')}</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">⏱️ Timeline:</h4>
                <p className="text-slate-600">Durasi: {months.length} bulan</p>
                <p className="text-slate-500">
                  {months[0]?.fullDate.toLocaleDateString('id-ID')} - {months[11]?.fullDate.toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📚 Cara Penggunaan</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>• <strong>Tambah Step:</strong> Klik &quot;Tambah Step&quot; untuk menambah proses baru</p>
            <p>• <strong>Isi Detail:</strong> Masukkan jenis pekerjaan, PIC, dan target untuk setiap step</p>
            <p>• <strong>Set Timeline:</strong> Klik bulan yang sesuai untuk mengatur kapan proses berjalan</p>
            <p>• <strong>Warna Otomatis:</strong> Sistem akan memberi warna berdasarkan jenis pekerjaan</p>
            <p>• <strong>Export:</strong> Gunakan tombol Print untuk menyimpan atau mencetak timeline</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}