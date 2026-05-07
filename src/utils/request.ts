import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: 'http://localhost:3001/api', // Backend API server address
  timeout: 5000
})

// Request interceptor
service.interceptors.request.use(
  (config) => {
    // Get token from localStorage (assuming it's stored as 'adminToken')
    // Note: Login page stored it as 'adminToken' but the value was `res.data.token`.
    // Wait, let me check login page again.
    // Yes: localStorage.setItem('adminToken', res.data.token)
    // However, the login response structure in app.js is { token, user }.
    // So 'adminToken' holds the string token.
    const token = localStorage.getItem('adminToken')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
service.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
      window.location.href = '/login'
    }
    ElMessage.error(error.response?.data?.message || '请求失败')
    return Promise.reject(error)
  }
)

export default service
