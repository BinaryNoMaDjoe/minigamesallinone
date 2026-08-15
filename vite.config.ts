import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // 忽略编辑器/工具写文件时产生的临时目录（Windows 下监视其内容会触发 EBUSY 崩溃）
      ignored: ['**/.*.tmpdir/**'],
    },
  },
})
