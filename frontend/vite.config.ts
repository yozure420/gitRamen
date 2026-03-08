import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Dockerの設定
  server: {
    host: '0.0.0.0',  // Docker内からアクセス可能に
    port: 5173,
    watch: {
      usePolling: true  // Dockerボリュームでのホットリロード対応
    },
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
