import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Enable polyfills for Node.js globals and modules
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Enable specific Node.js modules
      include: ['buffer', 'process'],
    }),
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['@mysten/sui/client', '@mysten/sui/transactions', '@mysten/dapp-kit'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          sui: ['@mysten/dapp-kit', '@mysten/sui'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
})
