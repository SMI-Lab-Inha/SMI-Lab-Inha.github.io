import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// News posts are Markdown so that longer items can carry formatting and links.
// One file per item: src/content/news/2026-03-01-title.md
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
  }),
});

export const collections = { news };
