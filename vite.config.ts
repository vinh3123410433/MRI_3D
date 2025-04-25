import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    react({
      // This will ensure React is built in production mode when running 'build'
      jsxRuntime: mode === 'production' ? 'automatic' : 'classic',
      babel: {
        // Add production configuration
        plugins: mode === 'production' ? ['transform-remove-console'] : []
      }
    })
  ],
  css: {
    postcss: './postcss.config.cjs'
  },
  // Ensure proper environment variables are set
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  }
}))