import service from '../utils/request'

export interface DisputeRow {
  id: number
  task_id: number
  task_title: string
  task_status: string
  reason: string
  status: 'pending' | 'resolved' | 'rejected'
  reporter_name: string | null
  publisher_name: string | null
  volunteer_name: string | null
  created_at: string
  updated_at: string
}

export interface DisputeListResponse {
  data: DisputeRow[]
  total: number
  page: number
  totalPages: number
}

export const getDisputes = (params: any) => {
  return service.get<any, DisputeListResponse>('/admin/tasks/disputes', { params })
}

export const getDisputeDetail = (id: number) => {
  return service.get<any, { data: any }>(`/admin/tasks/disputes/${id}`)
}

export const resolveDispute = (id: number, data: any) => {
  return service.post(`/admin/tasks/disputes/${id}/resolve`, data)
}

export const rejectDispute = (id: number, data: any) => {
  return service.post(`/admin/tasks/disputes/${id}/reject`, data)
}

