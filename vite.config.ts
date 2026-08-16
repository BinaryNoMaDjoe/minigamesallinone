import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // 忽略编辑器/工具产生的临时目录与文件（Windows 下监视被占用的临时文件会触发 EBUSY 崩溃）
      ignored: ['**/.*.tmpdir/**', '**/.tmp-shots/**', '**/_font-b64.txt'],
    },
  },
})
