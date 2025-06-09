import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  define: {
    'process.env': process.env
  },
  plugins: [
    react(),
    svgr()
  ],
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  resolve: {
    alias: [
      { find: '~', replacement: '/src' }
    ]
  }
})