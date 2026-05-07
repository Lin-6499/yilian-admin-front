import service from '../utils/request'

export interface PointsLogRow {
  id: number
  user_id: number
  username: string | null
  role: string | null
  phone: string | null
  amount: number
  type: string
  description: string | null
  related_id: number | null
  created_at: string
}

export interface PointsLogListResponse {
  data: PointsLogRow[]
  total: number
  page: number
  totalPages: number
}

export const getPointsLogs = (params: any) => {
  return service.get<any, PointsLogListResponse>('/admin/points/logs', { params })
}

export const adjustPoints = (data: any) => {
  return service.post('/admin/points/adjust', data)
}

