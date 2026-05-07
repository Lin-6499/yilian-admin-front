import service from '../utils/request'
import type { UserListResponse } from './user'

export const getAuditUsers = (params: any) => {
  return service.get<any, UserListResponse>('/admin/audit', { params })
}

export const approveUser = (id: number) => {
  return service.post(`/admin/audit/${id}/approve`)
}

export const rejectUser = (id: number) => {
  return service.post(`/admin/audit/${id}/reject`)
}
