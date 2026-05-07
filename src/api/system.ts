import service from '../utils/request'

export interface SosConfig {
  defaultContactName: string
  defaultPhone: string
  dialEnabled: boolean
  note: string
  createdAt?: string | null
  updatedAt?: string | null
  updatedById?: number | null
  updatedByName?: string
  updatedByRole?: string
  source?: string
  configPath?: string | null
  loadError?: string | null
}

export interface SosConfigResponse {
  config: SosConfig
  effective: {
    dialEnabled: boolean
    defaultContactName: string
    defaultPhone: string
  }
}

export interface SosTestTarget {
  contact_name: string
  phone: string
  source: string
  dial_enabled: boolean
  user_id: number | null
}

export interface SosTestResponse {
  message: string
  dial_target: SosTestTarget
  config: SosConfig
}

export const getSosConfig = () => {
  return service.get<any, SosConfigResponse>('/admin/system/sos')
}

export const updateSosConfig = (data: Partial<SosConfig>) => {
  return service.put<any, { message: string; config: SosConfig }>('/admin/system/sos', data)
}

export const testSosConfig = (data: { user_id?: number | string | null }) => {
  return service.post<any, SosTestResponse>('/admin/system/sos/test', data)
}