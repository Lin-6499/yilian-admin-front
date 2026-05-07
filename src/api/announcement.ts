import service from '../utils/request'

export interface AnnouncementRow {
  id: number
  title: string
  content: string
  status: 'draft' | 'published'
  is_pinned: number
  created_at: string
  updated_at: string
}

export interface AnnouncementListResponse {
  data: AnnouncementRow[]
  total: number
  page: number
  totalPages: number
}

export const getAnnouncements = (params: any) => {
  return service.get<any, AnnouncementListResponse>('/admin/announcements', { params })
}

export const createAnnouncement = (data: any) => {
  return service.post('/admin/announcements', data)
}

export const updateAnnouncement = (id: number, data: any) => {
  return service.put(`/admin/announcements/${id}`, data)
}

export const deleteAnnouncement = (id: number) => {
  return service.delete(`/admin/announcements/${id}`)
}

