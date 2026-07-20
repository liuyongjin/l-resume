import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const JAVA_API = process.env.ADMIN_JAVA_API_URL || 'http://127.0.0.1:8088';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: '127.0.0.1',
    proxy: {
      '/auth': {
        target: JAVA_API,
        changeOrigin: true,
      },
      '/admin': {
        target: JAVA_API,
        changeOrigin: true,
      },
    },
  },
});
