import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))

// Displayed in the UI and asserted by scripts/check-offline-artifact.sh.
// Derived from the installed package so it cannot drift from what actually
// ships; qrllib-browserify's own dependency on qrllib is the real version.
const qrllibPkg = JSON.parse(
  readFileSync(resolve('node_modules/@theqrl/qrllib-browserify/package.json'), 'utf8'),
)
const qrllibVersion = qrllibPkg.dependencies?.qrllib ?? qrllibPkg.version

function resolveCommit() {
  if (process.env.COMMIT_REF) return process.env.COMMIT_REF.slice(0, 12)
  try {
    return execSync('git rev-parse --short=12 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'unknown'
  }
}

const buildId = `${pkg.version}+${resolveCommit()}`

function inlinePublicAssets() {
  return {
    name: 'inline-public-assets',
    enforce: 'post',
    transformIndexHtml(html) {
      const qrllib = readFileSync(resolve('public/qrllib.js'), 'utf8')
      const favicon = readFileSync(resolve('public/favicon.ico')).toString('base64')
      return html
        .replace(/<script src="\.\/qrllib\.js"><\/script>/, () => `<script>${qrllib}</script>`)
        .replace(/href="\.\/favicon\.ico"/, `href="data:image/x-icon;base64,${favicon}"`)
    },
  }
}

function inlinePublicImports() {
  const id = '\0offline-logo-svg'
  return {
    name: 'inline-public-imports',
    resolveId(source) {
      if (source === '/logo.svg?raw') return id
    },
    load(source) {
      if (source === id) return `export default ${JSON.stringify(readFileSync(resolve('public/logo.svg'), 'utf8'))}`
    },
  }
}

export default defineConfig(({ mode }) => {
  const offline = mode === 'offline'
  return {
    base: './',
    publicDir: offline ? false : 'public',
    plugins: [...(offline ? [inlinePublicImports()] : []), vue(), ...(offline ? [viteSingleFile(), inlinePublicAssets()] : [])],
    resolve: {
      alias: {
        '@': resolve('src'),
        buffer: 'buffer',
        // jsPDF declares these as optional dependencies and reaches them
        // through dynamic import() in its HTML-rendering path. We only call
        // text/splitTextToSize/roundedRect/save, so that path is dead — but
        // the offline build inlines dynamic imports, which would otherwise
        // bake DOMPurify, html2canvas and canvg into the artefact users are
        // asked to trust with their seed. Stub them out instead.
        dompurify: resolve('src/empty-module.js'),
        html2canvas: resolve('src/empty-module.js'),
        canvg: resolve('src/empty-module.js'),
      },
    },
    define: {
      global: 'globalThis',
      __APP_VERSION__: JSON.stringify(pkg.version),
      __APP_BUILD_ID__: JSON.stringify(buildId),
      __OFFLINE_BUILD__: JSON.stringify(offline),
      __QRLLIB_VERSION__: JSON.stringify(qrllibVersion),
    },
    optimizeDeps: { include: ['buffer'] },
    build: {
      outDir: offline ? 'dist-offline' : 'dist',
      assetsInlineLimit: offline ? Number.MAX_SAFE_INTEGER : 4096,
      cssCodeSplit: !offline,
      // No `rollupOptions.output.inlineDynamicImports` here any more. Vite 8
      // builds on Rolldown, where vite-plugin-singlefile already sets
      // `codeSplitting: false` — which subsumes the option and made Vite warn
      // that it was being ignored. Removing it leaves the offline artefact
      // byte-for-byte identical; what actually guarantees a single file is the
      // "output files: 1" assertion in scripts/check-offline-artifact.sh.
    },
  }
})
