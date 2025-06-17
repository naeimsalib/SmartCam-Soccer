import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'window.Popper': '{}',
  },
  optimizeDeps: {
    include: [
      '@popperjs/core',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/system',
      '@mui/icons-material'
    ],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
