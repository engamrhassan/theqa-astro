import { defineCollection, z } from 'astro:content';

const articleCollection = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    author: z.string(),
    image: image().refine((img) => img.width >= 400, {
      message: "Cover image must be at least 400 pixels wide!",
    }),
    imageAlt: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  articles: articleCollection,
};
