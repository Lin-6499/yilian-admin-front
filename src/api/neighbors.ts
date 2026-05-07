import service from '../utils/request'

export interface NeighborPostRow {
  id: number
  author_id: number
  username: string | null
  real_name: string | null
  role: string | null
  content: string
  status: 'published' | 'hidden'
  is_pinned: number
  like_count: number
  comment_count: number
  report_count: number
  created_at: string
  updated_at: string
}

export interface NeighborListResponse {
  data: NeighborPostRow[]
  total: number
  page: number
  totalPages: number
}

export const getNeighborPosts = (params: any) => {
  return service.get<any, NeighborListResponse>('/admin/neighbors', { params })
}

export const updateNeighborPin = (id: number, isPinned: boolean) => {
  return service.put(`/admin/neighbors/${id}/pin`, { is_pinned: isPinned })
}