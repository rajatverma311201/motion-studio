import {loader} from 'fumadocs-core/source';
import {pageSchema} from 'fumadocs-core/source/schema';
import {defineDocs} from 'fumadocs-mdx/macro';
import {z} from 'zod';

export const docsSchema = pageSchema.extend({
  video: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .optional(),
  duration: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published']).default('published'),
});

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: docsSchema,
  },
});

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});
