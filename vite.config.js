// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       // Proxy path for n8n cloud to bypass CORS in development
//       '/n8n': {
//         target: 'https://nhathvm.app.n8n.cloud',
//         changeOrigin: true,
//         secure: true,
//         rewrite: (path) => path.replace(/^\/n8n/, ''),
//       },
//     },
//   },
// });

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
        proxy: {
          // Proxy path for n8n cloud to bypass CORS in development
          '/n8n': {
            target: 'https://nhathvm.app.n8n.cloud',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/n8n/, ''),
          },
        },
      },
  build: {
    // Memory optimization
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        // Simple chunking strategy to prevent circular dependencies
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          // Large UI libraries
          'ui-vendor': ['ag-grid-community', 'ag-grid-react', '@ag-grid-community/core'],
          // Chart libraries
          'chart-vendor': ['ag-charts-community', 'ag-charts-enterprise'],
          // Syncfusion
          'syncfusion-vendor': ['@syncfusion/ej2-base', '@syncfusion/ej2-react-spreadsheet'],
          // MUI
          'mui-vendor': ['@mui/material', '@emotion/react', '@emotion/styled']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
  },
  // Optimize dependencies to prevent circular imports
  optimizeDeps: {
    include: [
      'react', 
      'react-dom'
    ],
    force: true
  },
  // Define global variables to prevent hoisting issues
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
});