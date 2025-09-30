'use client'

import { useMemo } from 'react'
import { Calendar, momentLocalizer, Event } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { TaskStep } from '@/types/task'
import { Badge } from '@/components/ui/badge'

// Setup localizer for Indonesian
moment.locale('id', {
  months: 'Januari_Februari_Maret_April_Mei_Juni_Juli_Agustus_September_Oktober_November_Desember'.split('_'),
  monthsShort: 'Jan_Feb_Mar_Apr_Mei_Jun_Jul_Ags_Sep_Okt_Nov_Des'.split('_'),
  weekdays: 'Minggu_Senin_Selasa_Rabu_Kamis_Jumat_Sabtu'.split('_'),
  weekdaysShort: 'Min_Sen_Sel_Rab_Kam_Jum_Sab'.split('_'),
  weekdaysMin: 'Mg_Sn_Sl_Rb_Km_Jm_Sb'.split('_'),
})

const localizer = momentLocalizer(moment)

interface GoogleCalendarTimelineProps {
  tasks: TaskStep[]
}

// Convert tasks to calendar events
interface CalendarEvent extends Event {
  resource: {
    task: TaskStep
    color: string
  }
}

const getTaskColor = (task: TaskStep, index: number): string => {
  if (task.isMilestone) return '#FCD34D' // Yellow for milestone
  if (task.progress === 100) return '#10B981' // Green for completed
  if (task.progress > 0) return '#3B82F6' // Blue for in progress
  
  // Different colors for different tasks
  const colors = [
    '#EF4444', // Red
    '#F59E0B', // Orange
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#14B8A6', // Teal
  ]
  return colors[index % colors.length]
}

export function GoogleCalendarTimeline({ tasks }: GoogleCalendarTimelineProps) {
  const events: CalendarEvent[] = useMemo(() => {
    return tasks.map((task, index) => ({
      title: `${task.name} ${task.isMilestone ? '🎯' : ''} (${task.progress}%)`,
      start: task.startDate,
      end: task.endDate,
      resource: {
        task,
        color: getTaskColor(task, index)
      }
    }))
  }, [tasks])

  // Custom event style
  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.resource.color
    const style = {
      backgroundColor,
      borderRadius: '8px',
      opacity: 0.9,
      color: 'white',
      border: event.resource.task.isMilestone ? '3px solid #FBBF24' : '0px',
      display: 'block',
      fontSize: '12px',
      fontWeight: 600,
      padding: '4px 8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    }
    return { style }
  }

  // Custom day style (highlight Sundays)
  const dayPropGetter = (date: Date) => {
    const isSunday = date.getDay() === 0
    const isToday = moment(date).isSame(moment(), 'day')
    
    if (isToday) {
      return {
        className: 'rbc-today',
        style: {
          backgroundColor: '#DBEAFE',
          fontWeight: 'bold',
        }
      }
    }
    
    if (isSunday) {
      return {
        style: {
          backgroundColor: '#FEE2E2',
          color: '#DC2626',
        }
      }
    }
    
    return {}
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center text-slate-500 py-12">
        <p className="text-lg mb-2">📅 Belum ada task</p>
        <p className="text-sm">Tambahkan task untuk melihat timeline</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-lg border">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded bg-gray-400"></div>
          <span>Belum Mulai</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span>Sedang Berjalan</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span>Selesai</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded bg-yellow-400 border-2 border-yellow-500"></div>
          <span>🎯 Milestone</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded bg-red-200"></div>
          <span className="text-red-600">🔴 Minggu/Libur</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-500"></div>
          <span className="text-blue-600">📍 Hari Ini</span>
        </div>
      </div>

      {/* Task Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-slate-900">{tasks.length}</div>
          <div className="text-sm text-slate-600">Total Tasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">
            {tasks.filter(t => t.isMilestone).length}
          </div>
          <div className="text-sm text-slate-600">Milestones</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-blue-600">
            {tasks.filter(t => t.progress > 0 && t.progress < 100).length}
          </div>
          <div className="text-sm text-slate-600">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {tasks.filter(t => t.progress === 100).length}
          </div>
          <div className="text-sm text-slate-600">Completed</div>
        </div>
      </div>

      {/* Google Calendar View */}
      <div className="bg-white rounded-lg border-2 border-slate-200 p-4 shadow-lg">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          views={['month', 'week', 'agenda']}
          defaultView="month"
          eventPropGetter={eventStyleGetter}
          dayPropGetter={dayPropGetter}
          popup
          selectable
          messages={{
            next: "Berikutnya",
            previous: "Sebelumnya",
            today: "Hari Ini",
            month: "Bulan",
            week: "Minggu",
            day: "Hari",
            agenda: "Agenda",
            date: "Tanggal",
            time: "Waktu",
            event: "Task",
            noEventsInRange: "Tidak ada task di periode ini",
            showMore: (total: number) => `+${total} lainnya`
          }}
          tooltipAccessor={(event: CalendarEvent) => {
            const task = event.resource.task
            return `${task.name}\nPIC: ${task.pic || 'TBD'}\nProgress: ${task.progress}%\nDurasi: ${task.duration} hari`
          }}
        />
      </div>

      {/* Task Details List */}
      <div className="bg-white rounded-lg border-2 border-slate-200 p-6 shadow-lg">
        <h3 className="font-bold text-lg text-slate-900 mb-4">📋 Detail Tasks</h3>
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg border hover:shadow-md transition-all">
              <div 
                className="w-1 h-12 rounded-full" 
                style={{ backgroundColor: getTaskColor(task, index) }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-900">{index + 1}. {task.name}</span>
                  {task.isMilestone && <Badge variant="outline" className="text-yellow-600">🎯 Milestone</Badge>}
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm text-slate-600">
                  <div>👤 {task.pic || 'TBD'}</div>
                  <div>⏱️ {task.duration} hari</div>
                  <div>📅 {task.startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all"
                          style={{ 
                            width: `${task.progress}%`,
                            backgroundColor: getTaskColor(task, index)
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium">{task.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-xl">💡</div>
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Click &quot;Bulan&quot; / &quot;Minggu&quot; / &quot;Agenda&quot; untuk ganti view</li>
              <li>Hover task bar untuk lihat detail</li>
              <li>Click tanggal untuk melihat semua task di hari itu</li>
              <li>Minggu (hari merah) otomatis di-highlight</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}