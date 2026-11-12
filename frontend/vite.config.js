import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = (env.VITE_SOCKET_URL || env.VITE_API_URL || '').trim().replace(/\/api\/?$/, '')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      ...(apiOrigin
        ? {
            proxy: {
              '/api': {
                target: apiOrigin,
                changeOrigin: true,
              },
            },
          }
        : {}),
    },
  }
})
