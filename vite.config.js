import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Chrome MV3 service workers must be a single self-contained IIFE file.
// We build the popup (React) as a standard Vite/ESM app, and the service
// worker as a separate IIFE bundle by running a second Rollup pass via a plugin.

/** @type {import('vite').Plugin} */
function serviceWorkerPlugin() {
  return {
    name: 'service-worker-iife',
    apply: 'build',
    async writeBundle(options, bundle) {
      // The service worker is built separately — nothing extra needed here.
      // Rollup handles it via the multiple input entries below.
    },
  };
}

export default defineConfig(({ mode }) => {
  const isSWBuild = process.env.BUILD_TARGET === 'sw';

  if (isSWBuild) {
    // Second pass: build only the service worker as IIFE
    return {
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
          entry: resolve(__dirname, 'src/background/service_worker.js'),
          name: 'ServiceWorker',
          formats: ['iife'],
          fileName: () => 'background/service_worker.js',
        },
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
          },
        },
      },
    };
  }

  // Default pass: build popup (React app)
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'popup.html'),
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
  };
});
