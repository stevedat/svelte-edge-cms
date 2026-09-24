// @ts-check
import { getGithubFile, saveGithubFile } from './github.server.js';
import { slugify } from '$lib/utils.js';
import { env } from '$env/dynamic/private';

const localFiles = /** @type {Record<string, any>} */ (import.meta.glob('/src/content/**/*.json', { eager: true }));

/**
 * @param {string} domain
 * @param {string} fileName
 */
function getLocalData(domain, fileName) {
	const key = `/src/content/${domain}/${fileName}`;
	const defaultKey = `/src/content/default/${fileName}`;
	const file = localFiles[key] || localFiles[defaultKey];
	if (!file) return null;
	return file.default !== undefined ? file.default : file;
}

// Runtime In-Memory Cache (TTL: 60s) to eliminate redundant GitHub Edge roundtrips
const memoryCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

/**
 * Invalidate content cache for a domain and/or file
 * @param {string} [domain]
 * @param {string} [fileName]
 */
export function invalidateContentCache(domain, fileName) {
	if (domain && fileName) {
		memoryCache.delete(`${domain}/${fileName}`);
	} else if (domain) {
		for (const key of memoryCache.keys()) {
			if (key.startsWith(`${domain}/`)) memoryCache.delete(key);
		}
	} else {
		memoryCache.clear();
	}
}

/**
 * Helper to read data (Edge Fetch directly from GitHub with local fallback and runtime in-memory caching)
 * @param {string} [domain]
 * @param {string} [fileName]
 */
async function readData(domain = 'default', fileName = 'posts.json') {
	const safeDomain = domain || 'default';
	const cacheKey = `${safeDomain}/${fileName}`;
	const cached = memoryCache.get(cacheKey);
	if (cached && Date.now() < cached.expiresAt) {
		return cached.data;
	}

	/** @param {any} data */
	const returnCached = (data) => {
		if (data !== null && data !== undefined) {
			memoryCache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
		}
		return data;
	};

	// In Node/local dev environment, read directly from disk for live fresh data
	try {
		const fs = await import('node:fs/promises');
		const path = await import('node:path');
		const filePath = path.resolve(process.cwd(), `src/content/${safeDomain}/${fileName}`);
		const content = await fs.readFile(filePath, 'utf-8');
		return returnCached(JSON.parse(content));
	} catch (e) {
		// Try default domain on disk
		if (safeDomain !== 'default') {
			try {
				const fs = await import('node:fs/promises');
				const path = await import('node:path');
				const defaultFilePath = path.resolve(process.cwd(), `src/content/default/${fileName}`);
				const content = await fs.readFile(defaultFilePath, 'utf-8');
				return returnCached(JSON.parse(content));
			} catch (err) {}
		}
	}

	const repo = env.GITHUB_REPO || (env.GITHUB_REPO_OWNER && env.GITHUB_REPO_NAME ? `${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO_NAME}` : null);
	
	if (!env.GITHUB_TOKEN || !repo) {
		const local = getLocalData(safeDomain, fileName);
		if (local !== null && local !== undefined) return returnCached(local);
		return returnCached(fileName === 'settings.json' ? {} : []);
	}

	const branch = env.GITHUB_BRANCH || 'main';
	
	/** @param {string} d */
	const fetchFromGitHub = async (d) => {
		const url = `https://raw.githubusercontent.com/${repo}/${branch}/src/content/${d}/${fileName}`;
		const res = await fetch(url, {
			headers: {
				Authorization: `token ${env.GITHUB_TOKEN}`,
				Accept: 'application/vnd.github.v3.raw',
				'User-Agent': 'Svelte-EdgeCMS/1.0'
			}
		});
		if (!res.ok) {
			if (res.status === 404) return null;
			const text = await res.text();
			throw new Error(`GitHub Edge Fetch Error: ${text || res.statusText}`);
		}
		const text = await res.text();
		try {
			return JSON.parse(text);
		} catch (err) {
			console.warn(`Invalid JSON response from GitHub for ${d}/${fileName}:`, text.substring(0, 80));
			return null;
		}
	};

	try {
		let data = await fetchFromGitHub(safeDomain);
		if (data) return returnCached(data);
		
		// Fallback to default
		if (safeDomain !== 'default') {
			data = await fetchFromGitHub('default');
			if (data) return returnCached(data);
		}
	} catch (/** @type {any} */ e) {
		console.warn(`Failed to fetch ${fileName} from GitHub Edge:`, e?.message || e);
	}
	
	const localFallback = getLocalData(safeDomain, fileName);
	if (localFallback !== null && localFallback !== undefined) return returnCached(localFallback);

	if (fileName === 'settings.json') return returnCached({});
	return returnCached([]);
}

/**
 * Helper to save data back to GitHub and local filesystem
 * @param {string} [domain]
 * @param {string} [fileName]
 * @param {any} [data]
 * @param {string} [commitMessage]
 */
async function writeData(domain = 'default', fileName = 'posts.json', data = [], commitMessage = 'Update data') {
	const safeDomain = domain || 'default';
	// Immediately update/invalidate cache on write to preserve strong consistency
	invalidateContentCache(safeDomain, fileName);
	memoryCache.set(`${safeDomain}/${fileName}`, { data, expiresAt: Date.now() + CACHE_TTL_MS });

	const content = JSON.stringify(data, null, '\t');

	// In local dev/Node environment, write directly to local file for instant persistence & HMR
	try {
		const fs = await import('node:fs/promises');
		const path = await import('node:path');
		const filePath = path.resolve(process.cwd(), `src/content/${safeDomain}/${fileName}`);
		await fs.writeFile(filePath, content, 'utf-8');
	} catch (e) {
		// Ignore if running on pure Edge runtime without node:fs
	}

	const repoFullName = env.GITHUB_REPO || (env.GITHUB_REPO_OWNER && env.GITHUB_REPO_NAME ? `${env.GITHUB_REPO_OWNER}/${env.GITHUB_REPO_NAME}` : null);
	if (!env.GITHUB_TOKEN || !repoFullName) {
		return { success: true, localOnly: true };
	}
	return saveGithubFile(`src/content/${safeDomain}/${fileName}`, content, commitMessage);
}

// ===== POSTS =====

/**
 * @param {string} [domain]
 * @param {any} [options]
 */
export async function getPosts(domain = 'default', options = {}) {
	const { page = 1, limit = 10, search, categoryId } = options;
	let allPosts = await readData(domain, 'posts.json');

	// Filter
	let filtered = allPosts;
	if (categoryId) {
		filtered = filtered.filter((/** @type {any} */ p) => p.categorySlug === categoryId || p.categoryId === categoryId);
	}
	if (search) {
		const s = search.toLowerCase();
		filtered = filtered.filter((/** @type {any} */ p) => 
			p.title?.toLowerCase().includes(s) || 
			p.content?.toLowerCase().includes(s) || 
			p.excerpt?.toLowerCase().includes(s)
		);
	}

	// Sort by publishedAt / date (descending)
	filtered.sort((/** @type {any} */ a, /** @type {any} */ b) => new Date(b.publishedAt || b.date || 0).getTime() - new Date(a.publishedAt || a.date || 0).getTime());

	const total = filtered.length;
	const skip = (page - 1) * limit;
	const paginated = filtered.slice(skip, skip + limit);

	return {
		posts: paginated,
		total,
		pages: Math.ceil(total / limit)
	};
}

/**
 * @param {string | undefined} domain
 * @param {string} identifier
 * @param {boolean} [incrementView]
 */
export async function getPost(domain, identifier, incrementView = false) {
	const allPosts = await readData(domain, 'posts.json');
	const post = allPosts.find((/** @type {any} */ p) => p.slug === identifier || p.id === identifier);
	
	if (!post) throw new Error("Article does not exist");

	if (incrementView) {
		post.viewCount = (post.viewCount || 0) + 1;
	}

	return post;
}

/**
 * @param {string | undefined} domain
 * @param {any} data
 * @param {string} [authorId]
 */
export async function createPost(domain, data, authorId) {
	const posts = await readData(domain, 'posts.json');
	const slug = data.slug || slugify(data.title);
	
	if (posts.find((/** @type {any} */ p) => p.slug === slug)) {
		throw new Error(`Slug "${slug}" already exists`);
	}

	const newPost = {
		id: `post_${Date.now()}`,
		title: data.title,
		slug,
		content: data.content,
		excerpt: data.excerpt,
		status: data.status || 'DRAFT',
		authorId,
		categoryId: data.categoryId,
		categorySlug: data.categoryId,
		thumbnail: data.thumbnail,
		publishedAt: data.status === 'PUBLISHED' ? new Date().toISOString() : null,
		tags: data.tags || [],
		tagSlugs: data.tags || []
	};

	posts.unshift(newPost);
	await writeData(domain, 'posts.json', posts, `Create article: ${newPost.title}`);
	return newPost;
}

/**
 * @param {string | undefined} domain
 * @param {string} id
 * @param {any} data
 * @param {string} [userId]
 */
export async function updatePost(domain, id, data, userId) {
	const posts = await readData(domain, 'posts.json');
	const idx = posts.findIndex((/** @type {any} */ p) => p.id === id || p.slug === id);
	
	if (idx === -1) throw new Error('Article does not exist');

	if (data.slug && data.slug !== posts[idx].slug) {
		if (posts.find((/** @type {any} */ p) => p.slug === data.slug)) {
			throw new Error(`Slug "${data.slug}" already exists`);
		}
	}

	const updatedPost = {
		...posts[idx],
		...data,
		slug: data.slug || posts[idx].slug,
		publishedAt: data.status === 'PUBLISHED' && !posts[idx].publishedAt ? new Date().toISOString() : posts[idx].publishedAt,
		tagSlugs: data.tags || posts[idx].tagSlugs
	};

	posts[idx] = updatedPost;
	await writeData(domain, 'posts.json', posts, `Update article: ${updatedPost.title}`);
	return updatedPost;
}

/**
 * @param {string | undefined} domain
 * @param {string} id
 * @param {string} [userId]
 */
export async function deletePost(domain, id, userId) {
	const posts = await readData(domain, 'posts.json');
	const filtered = posts.filter((/** @type {any} */ p) => p.id !== id && p.slug !== id);
	await writeData(domain, 'posts.json', filtered, `Delete article: ${id}`);
	return true;
}

// ===== VIDEOS =====

/**
 * @param {string} [domain]
 * @param {any} [options]
 */
export async function getVideos(domain = 'default', options = {}) {
	const { page = 1, limit = 10, search } = options;
	let allVideos = await readData(domain, 'videos.json');

	let filtered = allVideos;
	if (search) {
		const s = search.toLowerCase();
		filtered = filtered.filter((/** @type {any} */ v) => v.title?.toLowerCase().includes(s) || v.description?.toLowerCase().includes(s));
	}

	const total = filtered.length;
	const skip = (page - 1) * limit;
	
	return {
		videos: filtered.slice(skip, skip + limit),
		total,
		pages: Math.ceil(total / limit)
	};
}

/**
 * @param {string | undefined} domain
 * @param {any} data
 * @param {string} [authorId]
 */
export async function createVideo(domain, data, authorId) {
	const videos = await readData(domain, 'videos.json');
	const newVideo = {
		id: `video_${Date.now()}`,
		...data,
		authorId,
		createdAt: new Date().toISOString()
	};
	videos.unshift(newVideo);
	await writeData(domain, 'videos.json', videos, `Create video: ${newVideo.title}`);
	return newVideo;
}

// ===== PROJECTS =====

/**
 * @param {string} [domain]
 * @param {any} [options]
 */
export async function getProjects(domain = 'default', options = {}) {
	const { page = 1, limit = 10, search } = options;
	let allProjects = await readData(domain, 'projects.json');

	let filtered = allProjects;
	if (search) {
		const s = search.toLowerCase();
		filtered = filtered.filter((/** @type {any} */ p) => p.title?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s));
	}

	const total = filtered.length;
	const skip = (page - 1) * limit;
	
	return {
		projects: filtered.slice(skip, skip + limit),
		total,
		pages: Math.ceil(total / limit)
	};
}

/**
 * @param {string | undefined} domain
 * @param {string} id
 */
export async function getProject(domain, id) {
	const projects = await readData(domain, 'projects.json');
	const project = projects.find((/** @type {any} */ p) => p.id === id || p.slug === id || p.title === id);
	return project || null;
}

/**
 * @param {string | undefined} domain
 * @param {any} data
 */
export async function createProject(domain, data) {
	const projects = await readData(domain, 'projects.json');
	const newProject = {
		id: data.id || `proj_${Date.now()}`,
		title: data.title || '',
		description: data.description || '',
		link: data.link || '',
		url: data.url || data.link || '',
		tags: data.tags || [],
		tagSlugs: data.tagSlugs || data.tags || [],
		status: data.status || 'COMPLETED',
		createdAt: new Date().toISOString(),
		...data
	};
	projects.unshift(newProject);
	await writeData(domain, 'projects.json', projects, `Create project: ${newProject.title}`);
	return newProject;
}

/**
 * @param {string | undefined} domain
 * @param {string} id
 * @param {any} data
 */
export async function updateProject(domain, id, data) {
	const projects = await readData(domain, 'projects.json');
	const idx = projects.findIndex((/** @type {any} */ p) => p.id === id || p.slug === id || p.title === id);
	if (idx === -1) {
		throw new Error(`Cannot find project with code: ${id}`);
	}
	const updated = {
		...projects[idx],
		...data,
		updatedAt: new Date().toISOString()
	};
	projects[idx] = updated;
	await writeData(domain, 'projects.json', projects, `Update project: ${updated.title}`);
	return updated;
}

/**
 * @param {string | undefined} domain
 * @param {string} id
 */
export async function deleteProject(domain, id) {
	const projects = await readData(domain, 'projects.json');
	const idx = projects.findIndex((/** @type {any} */ p) => p.id === id || p.slug === id || p.title === id);
	if (idx === -1) {
		throw new Error(`Cannot find project with code: ${id}`);
	}
	const deleted = projects[idx];
	const filtered = projects.filter((/** @type {any} */ _, /** @type {number} */ i) => i !== idx);
	await writeData(domain, 'projects.json', filtered, `Delete project: ${deleted.title || id}`);
	return true;
}

/**
 * @param {string | undefined} domain
 * @param {any[]} projects
 */
export async function saveProjects(domain, projects) {
	await writeData(domain, 'projects.json', projects, 'Update project list');
	return true;
}

// ===== CATEGORIES & TAGS =====

/**
 * @param {string} [domain]
 */
export async function getCategories(domain = 'default') {
	return readData(domain, 'categories.json');
}

/**
 * @param {string | undefined} domain
 * @param {any} data
 * @param {string} [userId]
 */
export async function createCategory(domain, data, userId) {
	const categories = await readData(domain, 'categories.json');
	const newCat = {
		id: `cat_${Date.now()}`,
		...data,
		slug: slugify(data.name)
	};
	categories.push(newCat);
	await writeData(domain, 'categories.json', categories, `Create category: ${newCat.name}`);
	return newCat;
}

/**
 * @param {string} [domain]
 */
export async function getTags(domain = 'default') {
	return readData(domain, 'tags.json');
}

/**
 * @param {string | undefined} domain
 * @param {string} name
 */
export async function findOrCreateTag(domain, name) {
	const tags = await readData(domain, 'tags.json');
	const slug = slugify(name);
	let tag = tags.find((/** @type {any} */ t) => t.slug === slug);
	
	if (!tag) {
		tag = { id: `tag_${Date.now()}`, name, slug };
		tags.push(tag);
		await writeData(domain, 'tags.json', tags, `Create tag: ${name}`);
	}
	return tag;
}

// ===== SETTINGS =====

/**
 * @param {string} [domain]
 */
export async function getSettings(domain = 'default') {
	const settings = await readData(domain, 'settings.json');
	return settings;
}

/**
 * @param {string | undefined} domain
 * @param {any} newSettings
 */
export async function updateSettings(domain, newSettings) {
	const settings = await readData(domain, 'settings.json');
	const updated = { ...settings, ...newSettings };
	await writeData(domain, 'settings.json', updated, `Update website configuration`);
	return updated;
}