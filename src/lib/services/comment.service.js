// @ts-check
import { getFile, createOrUpdateFile, listDirectory, isGitHubConfigured } from './github.server.js';

/**
 * @typedef {Object} Comment
 * @property {string} id
 * @property {string} name
 * @property {string} [email]
 * @property {string} content
 * @property {string} createdAt
 * @property {string} [parentId]
 * @property {string} [replyToName]
 * @property {boolean} [isAuthor]
 * @property {string} [postSlug]
 */

/**
 * Sanitize a slug to prevent directory traversal
 * @param {string} slug
 * @returns {string}
 */
function cleanSlug(slug) {
	return (slug || '').replace(/[^a-zA-Z0-9-_]/g, '').trim();
}

/**
 * @typedef {Omit<Comment, 'email'>} PublicComment
 */

/**
 * Remove sensitive fields (email) from comment for public guest viewing
 * @param {Comment} comment
 * @returns {PublicComment}
 */
export function sanitizePublicComment(comment) {
	if (!comment) return comment;
	const { email, ...safe } = comment;
	return safe;
}

// In-Memory Cache for Comments (TTL: 30s)
const commentCache = new Map();
const COMMENT_CACHE_TTL_MS = 30 * 1000;

/**
 * Invalidate comment cache for a domain and/or post slug
 * @param {string} [domain]
 * @param {string} [slug]
 */
export function invalidateCommentCache(domain, slug) {
	if (domain && slug) {
		commentCache.delete(`${domain}/${cleanSlug(slug)}`);
	} else if (domain) {
		for (const key of commentCache.keys()) {
			if (key.startsWith(`${domain}/`)) commentCache.delete(key);
		}
	} else {
		commentCache.clear();
	}
}

/**
 * Get comments for a specific post (includes email for admin moderation)
 * @param {string} domain
 * @param {string} slug
 * @returns {Promise<Comment[]>}
 */
export async function getComments(domain = 'default', slug) {
	const sanitizedSlug = cleanSlug(slug);
	if (!sanitizedSlug) return [];

	const cacheKey = `${domain}/${sanitizedSlug}`;
	const cached = commentCache.get(cacheKey);
	if (cached && Date.now() < cached.expiresAt) {
		return cached.data;
	}

	/** @param {any} data */
	const returnCached = (data) => {
		if (Array.isArray(data)) {
			commentCache.set(cacheKey, { data, expiresAt: Date.now() + COMMENT_CACHE_TTL_MS });
		}
		return data;
	};

	const pathStr = `src/content/${domain}/comments/${sanitizedSlug}.json`;

	// 1. Thử đọc từ filesystem cục bộ
	try {
		const fs = await import('node:fs/promises');
		const path = await import('node:path');
		const localFullPath = path.resolve(process.cwd(), pathStr);
		const content = await fs.readFile(localFullPath, 'utf-8');
		const parsed = JSON.parse(content);
		if (Array.isArray(parsed)) {
			const sorted = parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
			return returnCached(sorted);
		}
	} catch (_) {
		// Try default domain on disk
		if (domain !== 'default') {
			try {
				const fs = await import('node:fs/promises');
				const path = await import('node:path');
				const fallbackPath = path.resolve(process.cwd(), `src/content/default/comments/${sanitizedSlug}.json`);
				const content = await fs.readFile(fallbackPath, 'utf-8');
				const parsed = JSON.parse(content);
				if (Array.isArray(parsed)) {
					const sorted = parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
					return returnCached(sorted);
				}
			} catch (_) {}
		}
	}

	// 2. Fallback sang GitHub nếu cấu hình
	try {
		const file = await getFile(pathStr);
		if (!file || !file.content) {
			if (domain !== 'default') {
				const fallbackFile = await getFile(`src/content/default/comments/${sanitizedSlug}.json`);
				if (fallbackFile && fallbackFile.content) {
					const parsed = JSON.parse(fallbackFile.content);
					if (Array.isArray(parsed)) {
						const sorted = parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
						return returnCached(sorted);
					}
				}
			}
			return returnCached([]);
		}

		const parsed = JSON.parse(file.content);
		if (!Array.isArray(parsed)) return returnCached([]);

		const sorted = parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		return returnCached(sorted);
	} catch (error) {
		console.warn(`[Comments] Failed to load comments for ${slug}:`, /** @type {any} */ (error).message);
		return [];
	}
}

/**
 * Get sanitized public comments for a specific post (100% privacy-safe: email stripped)
 * @param {string} domain
 * @param {string} slug
 * @returns {Promise<PublicComment[]>}
 */
export async function getPublicComments(domain = 'default', slug) {
	const comments = await getComments(domain, slug);
	return comments.map(sanitizePublicComment);
}

/**
 * Add a comment to a specific post
 * @param {string} domain
 * @param {string} slug
 * @param {{ name: string; email?: string; content: string; parentId?: string; isAuthor?: boolean }} data
 * @returns {Promise<Comment>}
 */
export async function addComment(domain = 'default', slug, { name, email, content, parentId, isAuthor = false }) {
	const sanitizedSlug = cleanSlug(slug);
	if (!sanitizedSlug) {
		throw new Error('Invalid article path');
	}

	const cleanName = (name || '').trim().slice(0, 60);
	const cleanEmail = (email || '').trim().slice(0, 100);
	const cleanContent = (content || '').trim().slice(0, 2000);

	if (!cleanName || cleanName.length < 2) {
		throw new Error('Please enter full name (minimum 2 characters)');
	}

	if (!cleanContent || cleanContent.length < 2) {
		throw new Error('Please enter comment content (minimum 2 characters)');
	}

	const pathStr = `src/content/${domain}/comments/${sanitizedSlug}.json`;
	
	// Get existing comments
	/** @type {Comment[]} */
	let comments = await getComments(domain, sanitizedSlug);

	// 1-Level Nesting Check:
	let targetParentId = undefined;
	let replyToName = undefined;

	if (parentId) {
		const parent = comments.find(c => c.id === parentId);
		if (parent) {
			// Enforce max 1-level deep: if parent is already a reply, attach to its parent
			targetParentId = parent.parentId || parent.id;
			replyToName = parent.name;
		}
	}

	/** @type {Comment} */
	const newComment = {
		id: `cmt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
		name: cleanName,
		email: cleanEmail ? cleanEmail : undefined,
		content: cleanContent,
		createdAt: new Date().toISOString(),
		parentId: targetParentId,
		replyToName: replyToName,
		isAuthor: Boolean(isAuthor)
	};

	comments.unshift(newComment);

	const jsonContent = JSON.stringify(comments, null, '\t');
	const commitMessage = targetParentId 
		? `💬 Reply from ${cleanName} to "${replyToName}" on "${sanitizedSlug}"`
		: `💬 New comment from ${cleanName} on "${sanitizedSlug}"`;

	// 1. Ghi vào filesystem cục bộ
	try {
		const fs = await import('node:fs/promises');
		const path = await import('node:path');
		const localFullPath = path.resolve(process.cwd(), pathStr);
		await fs.mkdir(path.dirname(localFullPath), { recursive: true });
		await fs.writeFile(localFullPath, jsonContent, 'utf-8');
	} catch (fsErr) {
		console.warn('[Comments] Filesystem write failed:', /** @type {any} */ (fsErr).message);
	}

	// 2. Lưu vào GitHub nếu cấu hình
	if (isGitHubConfigured) {
		try {
			const existingFile = await getFile(pathStr);
			await createOrUpdateFile(pathStr, jsonContent, commitMessage, {
				sha: existingFile?.sha,
				skipCi: true
			});
		} catch (ghErr) {
			console.warn('[Comments] GitHub save failed:', /** @type {any} */ (ghErr).message);
		}
	}

	invalidateCommentCache(domain, sanitizedSlug);
	return newComment;
}

/**
 * Delete a specific comment and its replies
 * @param {string} domain
 * @param {string} slug
 * @param {string} commentId
 * @returns {Promise<boolean>}
 */
export async function deleteComment(domain = 'default', slug, commentId) {
	const sanitizedSlug = cleanSlug(slug);
	if (!sanitizedSlug || !commentId) return false;

	const pathStr = `src/content/${domain}/comments/${sanitizedSlug}.json`;
	let comments = await getComments(domain, sanitizedSlug);

	const originalLength = comments.length;
	comments = comments.filter(c => c.id !== commentId && c.parentId !== commentId);
	if (comments.length === originalLength) return false;

	const jsonContent = JSON.stringify(comments, null, '\t');

	// 1. Cập nhật filesystem cục bộ
	try {
		const fs = await import('node:fs/promises');
		const path = await import('node:path');
		const localFullPath = path.resolve(process.cwd(), pathStr);
		await fs.writeFile(localFullPath, jsonContent, 'utf-8');
	} catch (_) {}

	// 2. Cập nhật GitHub nếu cấu hình
	if (isGitHubConfigured) {
		try {
			const file = await getFile(pathStr);
			await createOrUpdateFile(pathStr, jsonContent, `🗑️ Delete comment ${commentId} on "${sanitizedSlug}"`, {
				sha: file?.sha,
				skipCi: true
			});
		} catch (_) {}
	}

	invalidateCommentCache(domain, sanitizedSlug);
	return true;
}

/**
 * Get all comments across all posts (for Admin moderation)
 * @param {string} domain
 * @returns {Promise<Comment[]>}
 */
export async function getAllComments(domain = 'default') {
	const dirPathStr = `src/content/${domain}/comments`;
	/** @type {Comment[]} */
	const allComments = [];

	// 1. Thử đọc từ filesystem cục bộ
	try {
		const fs = await import('node:fs/promises');
		const path = await import('node:path');
		const localDir = path.resolve(process.cwd(), dirPathStr);
		const entries = await fs.readdir(localDir);
		for (const entry of entries) {
			if (!entry.endsWith('.json')) continue;
			const slug = entry.replace(/\.json$/, '');
			const comments = await getComments(domain, slug);
			for (const c of comments) {
				allComments.push({
					...c,
					postSlug: slug
				});
			}
		}
		if (allComments.length > 0) {
			return allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		}
	} catch (_) {}

	// 2. Fallback sang GitHub nếu cấu hình
	try {
		const files = await listDirectory(dirPathStr);
		if (Array.isArray(files) && files.length > 0) {
			for (const file of files) {
				if (!file.name?.endsWith('.json')) continue;
				const slug = file.name.replace(/\.json$/, '');
				const comments = await getComments(domain, slug);
				for (const c of comments) {
					allComments.push({
						...c,
						postSlug: slug
					});
				}
			}
		}
	} catch (error) {
		console.warn('[Comments] Failed to fetch all comments from GitHub:', /** @type {any} */ (error).message);
	}

	return allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
