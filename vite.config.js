import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import ViteSvgLoader from 'vite-svg-loader'


// 按需加载
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from'unplugin-vue-components/resolvers'

export default defineConfig({
  // 添加插件
  plugins: [
    vue(),
    Components({
      resolvers: [AntDesignVueResolver()],
    }),
    ViteSvgLoader()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 8080,
    open: false,
    proxy: {
      // "/api": "http://34.85.2.159:5000"
      "/api": "http://localhost:5000"
    }
  },
})
