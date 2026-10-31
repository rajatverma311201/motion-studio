import {pageSchema} from 'fumadocs-core/source/schema';
import {defineDocs} from 'fumadocs-mdx/config';
import {z} from 'zod';
import {LESSON_STATUSES} from './src/lib/status';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema.extend({
      video: z
        .string()
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
        .optional(),
      status: z.enum(LESSON_STATUSES).default('outline'),
      duration: z.string().default('TBD'),
      youtube: z.string().url().optional(),
      recorded: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
      tags: z.array(z.string()).default([]),
    }),
  },
});
