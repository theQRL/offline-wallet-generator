import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { readFileSync } from 'fs'

// Custom plugin to inline public assets
function inlinePublicAssets() {
  return {
    name: 'inline-public-assets',
    enforce: 'post',
    transformIndexHtml(html) {
      // Inline qrllib.js
      const qrllibPath = resolve(__dirname, 'public/qrllib.js')
      const qrllibContent = readFileSync(qrllibPath, 'utf-8')
      html = html.replace(
        /<script src="\.\/qrllib\.js"><\/script>/,
        `<script>${qrllibContent}</script>`
      )

      // Inline favicon
      const faviconPath = resolve(__dirname, 'public/favicon.ico')
      const faviconContent = readFileSync(faviconPath)
      const faviconBase64 = faviconContent.toString('base64')
      html = html.replace(
        /href="\.\/favicon\.ico"/,
        `href="data:image/x-icon;base64,${faviconBase64}"`
      )

      return html
    }
  }
}

export default defineConfig({
  plugins: [vue(), viteSingleFile(), inlinePublicAssets()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      buffer: 'buffer',
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  build: {
    assetsInlineLimit: 100000000, // Inline all assets regardless of size
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  // Note: vite-plugin-singlefile creates a standalone index.html
  // The other files (qrllib.js, favicon.ico, etc.) in dist/ are build artifacts
  // and can be safely deleted - they are not referenced by the HTML
})
