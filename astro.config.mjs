import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://example.com',
  i18n: {
    defaultLocale: 'ar',
    locales: ['ar'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  output: 'static',
});