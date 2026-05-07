import service from '../utils/request'

export interface Activity {
  id: number
  title: string
  description?: string
  location: string
  start_time: string
  end_time: string
  max_participants: number
  image_url?: string
  created_at: string
  signup_count?: number
}

export interface ActivityListResponse {
  activities: Activity[]
  total: number
  page: number
  totalPages: number
}

export const getActivities = (params: any) => {
  return service.get<any, ActivityListResponse>('/admin/activities', { params })
}

export const createActivity = (data: any) => {
  return service.post('/admin/activities', data)
}

export const updateActivity = (id: number, data: any) => {
  return service.put(`/admin/activities/${id}`, data)
}

export const deleteActivity = (id: number) => {
  return service.delete(`/admin/activities/${id}`)
}

export interface ActivityParticipantRow {
  id: number
  activity_id: number
  user_id: number
  joined_at: string
  username: string
  real_name: string | null
  phone: string | null
  role: string
}

export interface ActivityParticipantsResponse {
  data: ActivityParticipantRow[]
  total: number
  page: number
  totalPages: number
}

export const getActivityParticipants = (id: number, params: any) => {
  return service.get<any, ActivityParticipantsResponse>(`/admin/activities/${id}/participants`, { params })
}
