import service from '../utils/request'

export interface TaskRow {
  id: number
  title: string
  description: string | null
  status: string
  publisher_name: string | null
  volunteer_name: string | null
  location: string | null
  scheduled_time: string | null
  points_reward: number | null
  created_at?: string
}

export interface TaskListResponse {
  data: TaskRow[]
  total: number
  page: number
  totalPages: number
}

export interface TaskDetailResponse {
  data: any
}

export const getTasks = (params: any) => {
  return service.get<any, TaskListResponse>('/admin/tasks', { params })
}

export const getTaskDetail = (id: number) => {
  return service.get<any, TaskDetailResponse>(`/admin/tasks/${id}`)
}

export const updateTaskStatus = (id: number, status: string) => {
  return service.put(`/admin/tasks/${id}/status`, { status })
}

export const unassignTask = (id: number) => {
  return service.post(`/admin/tasks/${id}/unassign`)
}
