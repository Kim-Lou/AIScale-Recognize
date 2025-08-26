import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ReactInjectorVitePlugin } from 'yunji-tagger';

export default defineConfig({
  plugins: [
    react(),
    ReactInjectorVitePlugin()
  ],
  // 配置环境变量前缀，允许在前端使用这些前缀的环境变量
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: {
    // 开发服务器配置
    port: 5173,
    strictPort: true,
    // 代理配置，将/api请求代理到后端服务器
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
