import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * 子应用必须允许主应用跨域拉取 HTML/JS/CSS（qiankun HTML Entry）
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 7101,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  // build: {
  //   // 如果你要做生产部署（非 dev），可以考虑 library 模式输出 UMD（视你的 qiankun 集成方式而定）
  // },
})


