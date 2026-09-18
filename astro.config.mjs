// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import { buildLastmodMap, lastmodFor } from './scripts/page-dates.mjs';

// Computed once per build. Empty on a shallow clone or outside git, in which
// case the sitemap is emitted without dates rather than with invented ones.
const lastmod = buildLastmodMap();

// Deployed as the SMI-Lab-Inha GitHub organisation site, so the repo is
// `SMI-Lab-Inha.github.io` and the site is served from the domain root.
// If this ever moves to a project repo, set `base: '/<repo-name>'`.
export default defineConfig({
  site: 'https://smi-lab-inha.github.io',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/team/alumni/'),
      serialize(item) {
        const date = lastmodFor(item.url, lastmod);
        return date ? { ...item, lastmod: date } : item;
      },
    }),
  ],
  build: {
    format: 'directory',
  },
});
