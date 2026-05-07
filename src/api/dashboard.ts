import service from '../utils/request'

export interface Overview {
  users: {
    total: number
    elderly: number
    volunteer: number
    family: number
    admin: number
  }
  audit: { pending: number }
  tasks: {
    total: number
    pending: number
    assigned: number
    in_progress: number
    completed: number
    cancelled: number
  }
  disputes: {
    total: number
    pending: number
    resolved: number
    rejected: number
  }
  today: {
    active_users: number
    new_users: number
    new_tasks: number
  }
  health_alerts: number
}

export interface Trends {
  days: string[]
  new_users: number[]
  new_tasks: number[]
  disputes: number[]
  points_in: number[]
  points_out: number[]
}

export const getOverview = () => {
  return service.get<any, Overview>('/admin/dashboard/overview')
}

export const getTrends = (params: { days?: number }) => {
  return service.get<any, Trends>('/admin/dashboard/trends', { params })
}

