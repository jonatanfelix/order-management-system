// Database Types
export interface Profile {
  id: string
  created_at: string
  updated_at: string
  name: string
  role: 'INPUTER' | 'APPROVER' | 'ADMIN'
  is_active: boolean
}

export interface Category {
  id: string
  created_at: string
  name: string
  slug: string
  description?: string
  is_active: boolean
}

export interface Template {
  id: string
  category_id: string
  created_at: string
  code: string
  name: string
  description?: string
  is_active: boolean
}

export interface TemplateStep {
  id: string
  template_id: string
  created_at: string
  name: string
  type: 'FIXED' | 'RATE'
  order_index: number
  base_duration_minutes: number
  rate_per_unit_minutes: number
  unit: string
}

export interface AdjustmentReason {
  id: string
  created_at: string
  code: string
  label: string
  default_minutes: number
  is_active: boolean
}

export interface Order {
  id: string
  created_at: string
  updated_at: string
  title: string
  client_name: string
  value_idr: number
  category_id: string
  template_id: string
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  eta_at?: string
  created_by: string
  approved_at?: string
  rejected_at?: string
}

export interface OrderStep {
  id: string
  order_id: string
  template_step_id: string
  created_at: string
  name_snapshot: string
  type_snapshot: 'FIXED' | 'RATE'
  unit_snapshot: string
  order_index: number
  qty?: number
  duration_minutes: number
}

export interface OrderAdjustment {
  id: string
  order_id: string
  reason_id: string
  created_at: string
  created_by: string
  minutes_delta: number
  note?: string
}

export interface Approval {
  id: string
  order_id: string
  approver_id: string
  created_at: string
  status: 'APPROVED' | 'REJECTED'
  note?: string
  decided_at: string
}

export interface PublicShare {
  id: string
  order_id: string
  created_at: string
  created_by: string
  code: string
  expires_at?: string
}

export interface AuditLog {
  id: string
  created_at: string
  order_id?: string
  actor_id?: string
  action: string
  payload: any
}

// Extended Types with Relations
export interface OrderWithRelations extends Order {
  category: Category
  template: Template
  created_by_profile: Profile
  steps: OrderStep[]
  adjustments: (OrderAdjustment & { 
    reason: AdjustmentReason
    created_by_profile: Profile 
  })[]
  approvals: (Approval & { 
    approver: Profile 
  })[]
  public_shares: PublicShare[]
}

export interface TemplateWithSteps extends Template {
  category: Category
  steps: TemplateStep[]
}

// Form Types
export interface OrderFormData {
  title: string
  client_name: string
  value_idr: number
  category_id: string
  template_id: string
  steps: {
    id: string
    qty?: number
  }[]
}

export interface AdjustmentFormData {
  reason_id: string
  minutes_delta: number
  note?: string
}

export interface ApprovalFormData {
  status: 'APPROVED' | 'REJECTED'
  note?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// Dashboard Stats
export interface OrderStats {
  total_orders: number
  draft_orders: number
  pending_orders: number
  approved_orders: number
  rejected_orders: number
  total_value: number
}

// Public Share Data
export interface PublicOrderData {
  order: {
    id: string
    title: string
    client_name: string
    status: string
    category: string
    template: string
    eta_at?: string
    created_at: string
  }
  steps: {
    name: string
    type: string
    duration_hours: number
    order_index: number
  }[]
  adjustments: {
    reason: string
    impact_hours: number
    created_at: string
  }[]
  share_expires_at?: string
}

// Currency formatter
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Date formatter
export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// Status badge colors
export const getStatusColor = (status: Order['status']): string => {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'PENDING_APPROVAL':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'APPROVED':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Status labels
export const getStatusLabel = (status: Order['status']): string => {
  switch (status) {
    case 'DRAFT':
      return 'Draft'
    case 'PENDING_APPROVAL':
      return 'Menunggu Persetujuan'
    case 'APPROVED':
      return 'Disetujui'
    case 'REJECTED':
      return 'Ditolak'
    default:
      return status
  }
}