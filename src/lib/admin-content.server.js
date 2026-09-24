// @ts-check
import matter from 'gray-matter';
import { getFile, listDirectory } from '$lib/services/github.server.js';

const POSTS_DIR = 'src/content/posts';

/**
 * @typedef {{ slug: string; meta: { title: string; date: string; tags: string[]; thumbnail: string } }} AdminPost
 */

/**
 * @returns {Promise<AdminPost[]>}
 */
export const fetchRemotePosts = async () => {
	try {
		const entries = await listDirectory(POSTS_DIR);
		if (Array.isArray(entries) && entries.length > 0) {
			const markdownFiles = entries.filter((entry) => entry.type === 'file' && entry.name.endsWith('.md'));
			const posts = [];

			for (const file of markdownFiles) {
				const remote = await getFile(file.path);
				if (!remote?.content) continue;
				const { data } = matter(remote.content);
				posts.push({
					slug: file.name.replace(/\.md$/, ''),
					meta: {
						title: data.title ?? file.name,
						date: data.date ?? new Date().toISOString(),
						tags: data.tags ?? [],
						thumbnail: data.thumbnail ?? ''
					}
				});
			}

			if (posts.length > 0) {
				return posts.sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1));
			}
		}
	} catch (error) {
		console.warn("Lỗi fetch GitHub content trong Admin. Dùng Mock Data", error);
	}

	// Fallback mock data when GitHub API fails or is empty
	return [
		{
			slug: "mock-post-1",
			meta: {
				title: "Khám phá Thiết kế Giao diện Hiện đại 2026",
				date: new Date().toISOString(),
				tags: ["Design", "Web"],
				thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000&auto=format&fit=crop"
			}
		},
		{
			slug: "mock-post-2",
			meta: {
				title: "Bí quyết tối ưu SvelteKit và Prisma",
				date: new Date().toISOString(),
				tags: ["SvelteKit", "Prisma"],
				thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop"
			}
		}
	];
};
