import { defineConfig } from 'vite';

// 构建产物直接输出到后端静态目录，Flask 单进程托管
export default defineConfig({
  base: '/',
  build: {
    outDir: '../web',
    emptyOutDir: true,
    target: 'es2019',
    cssCodeSplit: false,
    assetsInlineLimit: 8192,
    reportCompressedSize: false
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8765',
      '/docs': 'http://127.0.0.1:8765'
    }
  }
});
