import service from '../utils/request'

export interface User {
  id: number
  username: string
  role: string
  phone: string
  real_name: string
  emergency_contact?: string | null
  emergency_phone?: string | null
  created_at: string
}

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  totalPages: number
}

export const getUsers = (params: any) => {
  return service.get<any, UserListResponse>('/admin/users', { params })
}

export const createUser = (data: any) => {
  return service.post('/admin/users', data)
}

export const updateUser = (id: number, data: any) => {
  return service.put(`/admin/users/${id}`, data)
}

export const deleteUser = (id: number) => {
  return service.delete(`/admin/users/${id}`)
}
