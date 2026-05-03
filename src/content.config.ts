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

const typeSystem = defineCollection({
	loader: glob({ base: './src/content/type_system', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string().optional(),
		description: z.string().optional(),
		pubDate: z.coerce.date().optional(),
		updatedDate: z.coerce.date().optional(),
	}),
});

const chibaLevel1Spec = defineCollection({
	loader: glob({ base: './src/content/chiba-level1-spec', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string().optional(),
		description: z.string().optional(),
		pubDate: z.coerce.date().optional(),
		updatedDate: z.coerce.date().optional(),
	}),
});

export const collections = { blog, type_system: typeSystem, chiba_level1_spec: chibaLevel1Spec };
