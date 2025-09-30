'use client'

import { useMemo } from 'react'
import { TaskStep } from '@/types/task'
import { Calendar, Diamond, Clock, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TaskGanttPreviewProps {
  tasks: TaskStep[]
}

// Generate timeline weeks
const generateTimeline = (startDate: Date, endDate: Date) => {
  const weeks = []
  const current = new Date(startDate)
  
  // Start from Monday of the first week
  current.setDate(current.getDate() - current.getDay() + 1)
  
  while (current <= endDate) {
    const weekStart = new Date(current)
    const weekEnd = new Date(current)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    weeks.push({
      start: weekStart,
      end: weekEnd,
      label: `W${Math.ceil((current.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}`
    })
    
    current.setDate(current.getDate() + 7)
  }
  
  return weeks
}

// Check if a date is Sunday (holiday)
const isSunday = (date: Date) => date.getDay() === 0

// Get task position and width in timeline
const getTaskPosition = (task: TaskStep, timelineStart: Date, timelineEnd: Date, totalDays: number) => {
  const taskStart = Math.max(task.startDate.getTime(), timelineStart.getTime())
  const taskEnd = Math.min(task.endDate.getTime(), timelineEnd.getTime())
  
  const startOffset = (taskStart - timelineStart.getTime()) / (24 * 60 * 60 * 1000)
  const duration = (taskEnd - taskStart) / (24 * 60 * 60 * 1000) + 1
  
  const left = (startOffset / totalDays) * 100
  const width = (duration / totalDays) * 100
  
  return { left: `${left}%`, width: `${width}%` }
}

// Get task color based on type and progress
const getTaskColor = (task: TaskStep) => {
  if (task.isMilestone) return 'bg-yellow-500'
  if (task.progress === 100) return 'bg-green-500'
  if (task.progress > 0) return 'bg-blue-500'
  return 'bg-gray-400'
}

export function TaskGanttPreview({ tasks }: TaskGanttPreviewProps) {
  const { timeline, timelineStart, timelineEnd, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      return { timeline: [], timelineStart: new Date(), timelineEnd: new Date(), totalDays: 0 }
    }

    const allDates = tasks.flatMap(task => [task.startDate, task.endDate])
    const start = new Date(Math.min(...allDates.map(d => d.getTime())))
    const end = new Date(Math.max(...allDates.map(d => d.getTime())))
    
    // Add buffer
    start.setDate(start.getDate() - 7)
    end.setDate(end.getDate() + 7)
    
    const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    
    return {
      timeline: generateTimeline(start, end),
      timelineStart: start,
      timelineEnd: end,
      totalDays: days
    }
  }, [tasks])

  const today = new Date()
  const todayPosition = useMemo(() => {
    if (today >= timelineStart && today <= timelineEnd) {
      const offset = (today.getTime() - timelineStart.getTime()) / (24 * 60 * 60 * 1000)
      return (offset / totalDays) * 100
    }
    return null
  }, [today, timelineStart, timelineEnd, totalDays])

  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Tambahkan task untuk melihat timeline</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 rounded"></div>
          <span>Belum Mulai</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Sedang Berjalan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Selesai</span>
        </div>
        <div className="flex items-center gap-2">
          <Diamond className="w-4 h-4 text-yellow-500" />
          <span>Milestone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
          <span>Tanggal Merah (Minggu)</span>
        </div>
      </div>

      {/* Timeline Header - Calendar Style */}
      <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
        {/* Month/Week Headers */}
        <div className="grid gap-1 mb-3" style={{ gridTemplateColumns: `repeat(${Math.min(totalDays, 60)}, minmax(0, 1fr))` }}>
          {Array.from({ length: Math.min(totalDays, 60) }, (_, i) => {
            const date = new Date(timelineStart)
            date.setDate(date.getDate() + i)
            const isFirstOfMonth = date.getDate() === 1
            const isSundayDate = isSunday(date)
            const isToday = today.toDateString() === date.toDateString()
            
            return (
              <div
                key={i}
                className={`text-center ${
                  isToday ? 'bg-red-500 text-white font-bold' :
                  isSundayDate ? 'bg-red-100 text-red-700' :
                  isFirstOfMonth ? 'bg-blue-100 text-blue-900 font-semibold' :
                  'bg-white text-gray-700'
                } rounded px-1 py-2 border ${
                  isToday ? 'border-red-600' :
                  isSundayDate ? 'border-red-300' :
                  'border-gray-200'
                }`}
                title={date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              >
                <div className="text-[10px] leading-tight">
                  {isFirstOfMonth && (
                    <div className="font-bold text-[9px] mb-0.5">
                      {date.toLocaleDateString('id-ID', { month: 'short' })}
                    </div>
                  )}
                  <div className={isToday ? 'font-bold' : ''}>{date.getDate()}</div>
                  <div className="text-[8px] opacity-75">
                    {date.toLocaleDateString('id-ID', { weekday: 'narrow' })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Today marker legend */}
        {todayPosition !== null && (
          <div className="text-xs text-center text-red-600 font-semibold mb-2">
            📍 Hari Ini: {today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="space-y-3">
        {tasks.map((task, index) => {
          const position = getTaskPosition(task, timelineStart, timelineEnd, totalDays)
          const taskColor = getTaskColor(task)
          
          return (
            <div key={task.id} className="relative">
              <div className="flex items-center mb-1">
                <div className="w-8 text-xs text-gray-500 mr-2">{index + 1}</div>
                <div className="flex-1 flex items-center gap-2 text-sm">
                  <span className="font-medium">{task.name}</span>
                  {task.isMilestone && <Diamond className="h-3 w-3 text-yellow-500" />}
                  <Badge variant="outline" className="text-xs">
                    <User className="h-2 w-2 mr-1" />
                    {task.pic || 'TBD'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-2 w-2 mr-1" />
                    {task.duration} hari
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {task.progress}%
                  </span>
                </div>
              </div>
              
              <div className="relative h-8 bg-gray-100 border-2 border-gray-300 rounded-lg ml-10 overflow-hidden">
                {/* Task bar */}
                <div
                  className={`absolute top-0 bottom-0 ${taskColor} rounded flex items-center justify-center text-white text-xs font-medium transition-all shadow-md`}
                  style={position}
                >
                  {task.isMilestone ? (
                    <Diamond className="h-4 w-4" />
                  ) : (
                    <>
                      {/* Progress bar inside */}
                      {task.progress > 0 && (
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-green-400 opacity-60"
                          style={{ width: `${task.progress}%` }}
                        />
                      )}
                      <span className="relative z-10 truncate px-2 font-semibold drop-shadow-md">
                        {task.progress}%
                      </span>
                    </>
                  )}
                </div>
                
                {/* Dependencies lines */}
                {task.dependsOn.map(depId => {
                  const depTask = tasks.find(t => t.id === depId)
                  if (!depTask) return null
                  
                  const depPosition = getTaskPosition(depTask, timelineStart, timelineEnd, totalDays)
                  const depEndX = parseFloat(depPosition.left.replace('%', '')) + parseFloat(depPosition.width.replace('%', ''))
                  const taskStartX = parseFloat(position.left.replace('%', ''))
                  
                  return (
                    <div
                      key={depId}
                      className="absolute top-1/2 h-0.5 bg-orange-400 z-10"
                      style={{
                        left: `${depEndX}%`,
                        width: `${taskStartX - depEndX}%`,
                        transform: 'translateY(-50%)'
                      }}
                      title={`Menunggu: ${depTask.name}`}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Tasks:</span>
            <span className="ml-2">{tasks.length}</span>
          </div>
          <div>
            <span className="font-medium">Milestones:</span>
            <span className="ml-2">{tasks.filter(t => t.isMilestone).length}</span>
          </div>
          <div>
            <span className="font-medium">Durasi Total:</span>
            <span className="ml-2">{Math.max(...tasks.map(t => t.endDate.getTime())) - Math.min(...tasks.map(t => t.startDate.getTime())) > 0 
              ? Math.ceil((Math.max(...tasks.map(t => t.endDate.getTime())) - Math.min(...tasks.map(t => t.startDate.getTime()))) / (24 * 60 * 60 * 1000))
              : 0} hari</span>
          </div>
          <div>
            <span className="font-medium">Progress Rata-rata:</span>
            <span className="ml-2">{tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length) : 0}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}