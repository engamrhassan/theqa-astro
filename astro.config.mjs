import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://astro.theqalink.com',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),
  i18n: {
    defaultLocale: 'ar',
    locales: ['ar'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  output: 'server', // Enable SSR for dynamic pages
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
  }
});