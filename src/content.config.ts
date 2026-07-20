import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Field schema mirrors admin-config-sketch.yml's Decap CMS config exactly —
// this is the source of truth for both, don't let them drift apart.

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['how-to', 'buildout', 'community', 'announcement']),
    region: z
      .array(z.enum(['AUS', 'SAT', 'HOU', 'DFW', 'ELP', 'ABI', 'AMA', 'MFE', 'SJT', 'TXK', 'CRP', 'ACT']))
      .optional(),
    author: z.string().optional(),
    publishedAt: z.coerce.date(),
    thumbnail: z.string().optional(),
  }),
});

const hostInfo = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/host-info' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    thumbnail: z.string().optional(),
  }),
});

export const collections = { articles, 'host-info': hostInfo };
