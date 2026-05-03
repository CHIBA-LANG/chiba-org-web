// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { chibaLanguage } from './src/shiki/chiba-language.mjs';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
	site: 'https://chiba-lang.org',
	integrations: [mdx(), sitemap()],
	markdown: {
		shikiConfig: {
			langs: [chibaLanguage],
		},
	},
	vite: {
		plugins: [tailwindcss()],
	},
  	adapter: cloudflare(),
});