import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://astro.theqalink.com',
  i18n: {
    defaultLocale: 'ar',
    locales: ['ar'],
    routing: {
      prefixDefaultLocale: false
    }
  },
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
  }
});