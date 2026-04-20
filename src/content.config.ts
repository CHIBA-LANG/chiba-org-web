import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		// Transform string to Date object
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		// Public path e.g. /chiba0.jpeg — stable URL, no Astro processing
		heroImage: z.string().optional(),
		// Absolute OG image URL, defaults to SITE_URL + heroImage
		ogImage: z.string().url().optional(),
	}),
});

export const collections = { blog };
