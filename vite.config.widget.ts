// ─────────────────────────────────────────────
//  SiteLearn Chat Widget — Vite Widget Build
//  Run: vite build --config vite.config.widget.ts
// ─────────────────────────────────────────────

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  // ── CSS pipeline ──
  // The widget uses plain CSS (no Tailwind), so we override the global
  // postcss.config.mjs (which pulls in @tailwindcss/postcss) with an empty
  // plugins object. Without this, PostCSS fails on the ?inline import.
  css: {
    postcss: {
      plugins: [],
    },
  },

  build: {
    // Write widget output into dist/widget/
    outDir: 'dist/widget',
    emptyOutDir: true,

    // Single IIFE bundle — no code-splitting
    lib: {
      entry: resolve(__dirname, 'src/widget/index.tsx'),
      name: 'SiteLearnWidget',
      // Produces: widget.iife.js (minified)
      fileName: (format) => `widget.${format}.js`,
      formats: ['iife'],
    },

    rollupOptions: {
      // React & ReactDOM are bundled in so the embed is self-contained
      external: [],

      output: {
        // Inline all assets (CSS, SVGs) into the single JS bundle
        inlineDynamicImports: true,
        // Readable global name for IIFE
        name: 'SiteLearnWidget',
        // Ensure styles are injected via shadow DOM (not a separate .css file)
        assetFileNames: 'assets/[name][extname]',
      },
    },

    // Minify for CDN distribution
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,   // keep console.warn for user feedback
        drop_debugger: true,
        passes: 2,
      },
      format: {
        comments: false,
      },
    },

    // Report bundle size
    reportCompressedSize: true,

    // CSS is inlined via ?inline import — no separate file needed
    cssCodeSplit: false,
  },

  resolve: {
    alias: {
      '@widget': resolve(__dirname, 'src/widget'),
    },
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});

