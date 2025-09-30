'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface PIC {
  id: string
  name: string
  role?: string
}

interface PicSelectorProps {
  value?: string
  onChange: (pic: string) => void
  label?: string
  placeholder?: string
  className?: string
}

export function PicSelector({ value, onChange, label = 'PIC/Penanggung Jawab', placeholder = 'Pilih PIC', className }: PicSelectorProps) {
  const [pics, setPics] = useState<PIC[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPICs() {
      try {
        const response = await fetch('/api/pics')
        if (response.ok) {
          const data = await response.json()
          setPics(data)
        }
      } catch (error) {
        console.error('Error fetching PICs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPICs()
  }, [])

  return (
    <div className={className}>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder={loading ? 'Loading...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tidak ada PIC</SelectItem>
          {pics.map((pic) => (
            <SelectItem key={pic.id} value={pic.name}>
              {pic.name} {pic.role && `(${pic.role})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}