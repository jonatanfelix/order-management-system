// Standard Order Status Constants
// Digunakan di seluruh aplikasi untuk konsistensi

export const ORDER_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
} as const

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]

export const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Menunggu Persetujuan',
  APPROVED: 'Disetujui',
  IN_PROGRESS: 'Dalam Proses',
  COMPLETED: 'Selesai',
  REJECTED: 'Ditolak',
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  DRAFT: 'secondary',
  PENDING_APPROVAL: 'outline',
  APPROVED: 'default',
  IN_PROGRESS: 'secondary',
  COMPLETED: 'default',
  REJECTED: 'destructive',
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status as OrderStatus] || status
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status as OrderStatus] || 'outline'
}