import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    port: 3101, // 强制指定端口
    proxy: {
      '/api': {
        target: 'https://43.138.138.136:3100', // 注意 https
        changeOrigin: true,
        secure: false,   // 忽略自签名证书错误
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/uploads': {        // 新增对 /uploads 的代理
        target: 'https://43.138.138.136:3100',
        changeOrigin: true,
        secure: false
        // 不需要 rewrite，保留 /uploads 路径
      }
    }
  }
})
