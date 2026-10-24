// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://815live.com',
  output: 'static',
  // Clean URLs: /venues/marys-place (Cloudflare Pages serves marys-place.html there).
  trailingSlash: 'never',
  build: { format: 'file' },
});
