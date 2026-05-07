import service from '../utils/request'

export interface AdminProduct {
  id: number
  name: string
  description?: string
  image_url?: string
  price_points: number
  stock: number
  category: string
  created_at?: string
}

export const getAdminProducts = (params: any) => {
  return service.get<any, { products: AdminProduct[] }>('/admin/products', { params })
}

export const createAdminProduct = (data: any) => {
  return service.post('/admin/products', data)
}

export const updateAdminProduct = (id: number, data: any) => {
  return service.put(`/admin/products/${id}`, data)
}

export const deleteAdminProduct = (id: number) => {
  return service.delete(`/admin/products/${id}`)
}
