import service from '../utils/request'

export interface OrderItem {
  id: number
  user_id: number
  product_id: number
  points_cost: number
  status: string
  created_at: string
  product_name?: string
  product_image?: string
  username?: string
  phone?: string
}

export const getOrders = (params: any) => {
  return service.get<any, { orders: OrderItem[] }>('/admin/orders', { params })
}

export const getOrder = (id: number) => {
  return service.get(`/admin/orders/${id}`)
}

export const updateOrderStatus = (id: number, data: any) => {
  return service.put(`/admin/orders/${id}/status`, data)
}
