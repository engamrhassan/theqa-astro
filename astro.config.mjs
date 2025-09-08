import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://astro.theqalink.com',

  i18n: {
    defaultLocale: 'ar',
    locales: ['ar'],
    routing: {
      prefixDefaultLocale: false
    }
  },

  // Back to static for better performance
  output: 'static',

  build: {
    inlineStylesheets: 'auto'
  },

  vite: {
    build: {
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['astro']
          }
        }
      }
    }
  },

  adapter: cloudflare()
});