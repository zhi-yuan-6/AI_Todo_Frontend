import {
  fileURLToPath,
  URL
} from 'node:url'
import {
  defineConfig
} from 'vite'
import vue from '@vitejs/plugin-vue'
import {
  loadEnv
} from 'vite'

export default defineConfig(({
  mode
}) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      target: `http://localhost:8080`,
      changeOrigin: true,
    },
    plugins: [
      vue(),
      // vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src',
          import.meta.url))
      },
    },
    envPrefix: ['Vue_APP'],
    // 定义 process.env
    define: {
      'process.env': env
    }
  }
})
