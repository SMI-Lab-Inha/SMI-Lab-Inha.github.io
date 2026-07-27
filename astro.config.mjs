// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Deployed as the SMI-Lab-Inha GitHub organisation site, so the repo is
// `SMI-Lab-Inha.github.io` and the site is served from the domain root.
// If this ever moves to a project repo, set `base: '/<repo-name>'`.
export default defineConfig({
  site: 'https://smi-lab-inha.github.io',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
});
