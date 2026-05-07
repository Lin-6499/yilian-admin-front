import service from '../utils/request'

export interface AdminVideoCourse {
  id: number
  title: string
  category: 'yangsheng' | 'xiqu' | 'legal'
  description?: string
  video_url: string
  cover_url?: string
  tags?: string[] | string
  status: 'published' | 'hidden'
  sort_order: number
  created_at?: string
  updated_at?: string
}

export const getAdminVideos = (params: any) => {
  return service.get<any, { data: AdminVideoCourse[]; total: number }>('/admin/videos', { params })
}

export const createAdminVideo = (data: any) => {
  return service.post('/admin/videos', data)
}

export const updateAdminVideo = (id: number, data: any) => {
  return service.put(`/admin/videos/${id}`, data)
}

export const updateAdminVideoStatus = (id: number, status: 'published' | 'hidden') => {
  return service.patch(`/admin/videos/${id}/status`, { status })
}

export const deleteAdminVideo = (id: number) => {
  return service.delete(`/admin/videos/${id}`)
}
