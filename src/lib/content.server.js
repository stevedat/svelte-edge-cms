// @ts-check
import { getPosts as dbGetPosts, getPost as dbGetPost, getVideos as dbGetVideos, getProjects as dbGetProjects } from './services/content.service.js';

/**
 * @typedef {{ slug: string; meta: { title: string; title_en?: string; date: string; tags: string[]; thumbnail: string }; content: string; content_en?: string; excerpt?: string; excerpt_en?: string }} PostEntry
 */

/**
 * Helper to generate plain text excerpt from markdown if missing
 * @param {string} [content]
 * @returns {string}
 */
function cleanExcerptText(content) {
	if (!content) return '';
	return content
		.replace(/#+\s+/g, '')
		.replace(/(\*\*|__)(.*?)\1/g, '$2')
		.replace(/(\*|_)(.*?)\1/g, '$2')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/<[^>]*>?/gm, '')
		.trim()
		.substring(0, 160) + '...';
}

/**
 * @typedef {{ slug: string; meta: { title: string; title_en?: string; date: string; tags: string[]; thumbnail: string }; excerpt?: string; excerpt_en?: string; readingMinutes: number }} PostSummary
 */

/**
 * Get lightweight post summaries (omitting full content) for index/listing pages
 * @param {string} [domain]
 * @returns {Promise<PostSummary[]>}
 */
export const getPostSummaries = async (domain = 'default') => {
	try {
		const { posts } = await dbGetPosts(domain, { limit: 100 });
		return posts.map((/** @type {any} */ post) => {
			const words = (post.content || '').trim().split(/\s+/).filter(Boolean).length;
			const readingMinutes = Math.max(2, Math.ceil(words / 200));
			return {
				slug: post.slug,
				meta: {
					title: post.title,
					title_en: post.title_en || post.title,
					date: post.publishedAt || post.createdAt || new Date().toISOString(),
					tags: post.tags || post.tagSlugs || [],
					thumbnail: post.thumbnail || ''
				},
				excerpt: post.excerpt || cleanExcerptText(post.content),
				excerpt_en: post.excerpt_en || cleanExcerptText(post.content_en || post.content),
				readingMinutes
			};
		});
	} catch (error) {
		console.error('Lỗi khi lấy post summaries:', error);
		return [];
	}
};

/**
 * @param {string} [domain]
 * @returns {Promise<PostEntry[]>}
 */
export const getAllPosts = async (domain = 'default') => {
	try {
		const { posts } = await dbGetPosts(domain, { limit: 100 });
		return posts.map((/** @type {any} */ post) => ({
			slug: post.slug,
			meta: {
				title: post.title,
				title_en: post.title_en || post.title,
				date: post.publishedAt || post.createdAt || new Date().toISOString(),
				tags: post.tags || post.tagSlugs || [],
				thumbnail: post.thumbnail || ''
			},
			content: post.content || '',
			content_en: post.content_en || '',
			excerpt: post.excerpt || cleanExcerptText(post.content),
			excerpt_en: post.excerpt_en || cleanExcerptText(post.content_en || post.content)
		}));
	} catch (error) {
		console.error('Lỗi khi lấy posts:', error);
		return [];
	}
};

/**
 * @param {string | undefined} domain
 * @param {string} slug
 * @returns {Promise<PostEntry | null>}
 */
export const getPost = async (domain, slug) => {
	try {
		const post = await dbGetPost(domain, slug, true);
		if (!post) return null;
		
		// In flat JSON, some posts might not have status initially
		if (post.status && post.status !== 'PUBLISHED') return null;
		
		return {
			slug: post.slug,
			meta: {
				title: post.title,
				title_en: post.title_en || post.title,
				date: post.publishedAt || post.createdAt || new Date().toISOString(),
				tags: post.tags || post.tagSlugs || [],
				thumbnail: post.thumbnail || ''
			},
			content: post.content || '',
			content_en: post.content_en || ''
		};
	} catch (error) {
		console.error(`Lỗi khi lấy post ${slug}:`, error);
		return null;
	}
};

/**
 * @param {string} [domain]
 */
export const getVideos = async (domain = 'default') => {
	try {
		const { videos } = await dbGetVideos(domain, { limit: 100 });
		return videos.map((/** @type {any} */ v) => ({
			id: v.id,
			title: v.title,
			title_en: v.title_en || v.title,
			url: v.url,
			platform: v.platform,
			thumbnail: v.thumbnail,
			description: v.description || '',
			description_en: v.description_en || ''
		}));
	} catch (error) {
		console.error('Lỗi khi lấy videos:', error);
		return [];
	}
};

/**
 * @param {string} [domain]
 */
export const getProjects = async (domain = 'default') => {
	try {
		const { projects } = await dbGetProjects(domain, { limit: 100 });
		return projects.map((/** @type {any} */ p) => ({
			id: p.id,
			title: p.title,
			tagline: p.tagline || '',
			tagline_en: p.tagline_en || '',
			description: p.description,
			description_en: p.description_en || '',
			highlights: p.highlights || [],
			highlights_en: p.highlights_en || [],
			link: p.url || p.link || p.githubUrl,
			url: p.url || p.link || p.githubUrl,
			tags: p.tags || p.tagSlugs || [],
			tags_en: p.tags_en || p.tagSlugs_en || p.tags || p.tagSlugs || [],
			techSlugs: p.techSlugs || [],
			platforms: p.platforms || ['Web'],
			platforms_en: p.platforms_en || p.platforms || ['Web'],
			appStoreUrl: p.appStoreUrl || '',
			playStoreUrl: p.playStoreUrl || '',
			thumbnail: p.thumbnail,
			categorySlug: p.categorySlug || 'web-development',
			content: p.content
		}));
	} catch (error) {
		console.error('Lỗi khi lấy projects:', error);
		return [];
	}
};
