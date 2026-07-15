import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      'react-is': 'react-is',
    },
  },
  optimizeDeps: {
    include: ['react-is', 'recharts'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
})
