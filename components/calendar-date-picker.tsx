'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CalendarDatePickerProps {
  selectedDate?: Date
  onDateSelect: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  className?: string
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export function CalendarDatePicker({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  className
}: CalendarDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date())
  
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  
  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()
  
  // Get days from previous month to fill the grid
  const previousMonth = new Date(year, month, 0)
  const daysInPreviousMonth = previousMonth.getDate()
  
  // Build calendar grid
  const calendarDays: (Date | null)[] = []
  
  // Previous month days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push(new Date(year, month - 1, daysInPreviousMonth - i))
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day))
  }
  
  // Next month days to complete the grid
  const remainingDays = 42 - calendarDays.length // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push(new Date(year, month + 1, day))
  }
  
  const isDateDisabled = (date: Date | null): boolean => {
    if (!date) return true
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }
  
  const isDateSelected = (date: Date | null): boolean => {
    if (!date || !selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }
  
  const isToday = (date: Date | null): boolean => {
    if (!date) return false
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }
  
  const isCurrentMonth = (date: Date | null): boolean => {
    if (!date) return false
    return date.getMonth() === month
  }
  
  const isSunday = (date: Date | null): boolean => {
    if (!date) return false
    return date.getDay() === 0
  }
  
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(year, month - 1))
  }
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1))
  }
  
  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    onDateSelect(today)
  }
  
  return (
    <Card className={cn('p-4 shadow-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900">
            {MONTHS[month]} {year}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="text-xs px-3"
          >
            Hari Ini
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day, index) => (
            <div
              key={day}
              className={cn(
                'text-center text-xs font-semibold py-2',
                index === 0 ? 'text-red-600' : 'text-slate-600'
              )}
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Date cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const disabled = isDateDisabled(date)
            const selected = isDateSelected(date)
            const today = isToday(date)
            const currentMonth = isCurrentMonth(date)
            const sunday = isSunday(date)
            
            return (
              <button
                key={index}
                onClick={() => date && !disabled && onDateSelect(date)}
                disabled={disabled}
                className={cn(
                  'h-10 w-full rounded-md text-sm font-medium transition-all',
                  'hover:bg-blue-50 hover:scale-105',
                  'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:scale-100',
                  !currentMonth && 'text-slate-400',
                  currentMonth && !sunday && 'text-slate-900',
                  sunday && 'text-red-500 font-semibold',
                  today && !selected && 'bg-blue-100 ring-2 ring-blue-500',
                  selected && 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
                  !selected && !today && currentMonth && 'hover:ring-1 hover:ring-blue-300'
                )}
              >
                {date?.getDate()}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Footer info */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-100 ring-2 ring-blue-500"></div>
              <span>Hari ini</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span>Dipilih</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-100"></div>
              <span className="text-red-600">Tanggal merah</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}