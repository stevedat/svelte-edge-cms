// @ts-check
import { error, fail, redirect, isRedirect } from '@sveltejs/kit';
import { createOrUpdateFile, getFile } from '$lib/services/github.server.js';

/**
 * @param {unknown} data
 */
const toJson = (data) => `${JSON.stringify(data, null, 2)}\n`;

export const load = async ({ params, locals }) => {
	const videoId = params.id;
	const domain = locals?.domain || 'default';
	const domainPath = `src/content/${domain}/videos.json`;
	
	try {
		/** @type {any[]} */
		let videos = [];
		let sha = undefined;

		try {
			const remote = await getFile(domainPath);
			if (remote?.content) {
				videos = JSON.parse(remote.content);
				sha = remote.sha;
			}
		} catch (e) {
			console.warn('Failed to fetch from GitHub, falling back to local file:', e);
		}

		// Local fallback
		if (!videos || videos.length === 0) {
			try {
				const fs = await import('node:fs/promises');
				const path = await import('node:path');
				const content = await fs.readFile(path.resolve(process.cwd(), domainPath), 'utf-8');
				videos = JSON.parse(content);
			} catch (localErr) {
				// Try default folder
				if (domain !== 'default') {
					try {
						const fs = await import('node:fs/promises');
						const path = await import('node:path');
						const content = await fs.readFile(path.resolve(process.cwd(), 'src/content/default/videos.json'), 'utf-8');
						videos = JSON.parse(content);
					} catch (defErr) {}
				}
			}
		}

		const video = videos.find((v) => v.id === videoId);
		if (!video) {
			throw error(404, 'Không tìm thấy video');
		}

		return {
			video,
			sha
		};
	} catch (err) {
		console.error('Failed to load video', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Không thể tải video');
	}
};

export const actions = {
	update: async ({ request, params, locals }) => {
		const form = await request.formData();
		const videoId = params.id;
		const title = form.get('title')?.toString().trim();
		const platform = form.get('platform')?.toString().trim();
		const url = form.get('url')?.toString().trim();
		const sha = form.get('sha')?.toString();
		const domain = locals?.domain || 'default';
		const domainPath = `src/content/${domain}/videos.json`;

		if (!title || !platform || !url) {
			return fail(400, { message: 'Điền đủ thông tin video' });
		}

		try {
			/** @type {any[]} */
			let videos = [];
			let remoteSha = sha;

			try {
				const remote = await getFile(domainPath);
				if (remote?.content) {
					videos = JSON.parse(remote.content);
					remoteSha = remote.sha;
				}
			} catch (e) {
				console.warn('GitHub getFile failed:', e);
			}

			// Local read fallback if needed
			if (!videos || videos.length === 0) {
				try {
					const fs = await import('node:fs/promises');
					const path = await import('node:path');
					const content = await fs.readFile(path.resolve(process.cwd(), domainPath), 'utf-8');
					videos = JSON.parse(content);
				} catch (err) {
					try {
						const fs = await import('node:fs/promises');
						const path = await import('node:path');
						const content = await fs.readFile(path.resolve(process.cwd(), 'src/content/default/videos.json'), 'utf-8');
						videos = JSON.parse(content);
					} catch (e2) {}
				}
			}

			const videoIndex = videos.findIndex((v) => v.id === videoId);
			if (videoIndex === -1) {
				return fail(404, { message: 'Không tìm thấy video để cập nhật' });
			}

			videos[videoIndex] = {
				...videos[videoIndex],
				title,
				platform,
				url
			};

			const jsonContent = toJson(videos);

			// Try GitHub first, fallback to local write
			try {
				await createOrUpdateFile(domainPath, jsonContent, `Update video ${title}`, {
					sha: remoteSha
				});
			} catch (githubError) {
				console.warn('GitHub update failed, saving locally:', githubError);
				try {
					const fs = await import('node:fs/promises');
					const path = await import('node:path');
					await fs.writeFile(path.resolve(process.cwd(), domainPath), jsonContent, 'utf-8');
				} catch (localWriteError) {
					throw githubError;
				}
			}

			throw redirect(303, '/admin/videos');
		} catch (error) {
			if (isRedirect(error)) throw error;
			console.error('Failed to update video', error);
			return fail(500, { message: 'Không thể cập nhật video' });
		}
	},

	delete: async ({ params, locals }) => {
		const videoId = params.id;
		const domain = locals?.domain || 'default';
		const domainPath = `src/content/${domain}/videos.json`;

		try {
			/** @type {any[]} */
			let videos = [];
			let remoteSha;

			try {
				const remote = await getFile(domainPath);
				if (remote?.content) {
					videos = JSON.parse(remote.content);
					remoteSha = remote.sha;
				}
			} catch (e) {}

			if (!videos || videos.length === 0) {
				try {
					const fs = await import('node:fs/promises');
					const path = await import('node:path');
					const content = await fs.readFile(path.resolve(process.cwd(), domainPath), 'utf-8');
					videos = JSON.parse(content);
				} catch (err) {}
			}

			const videoIndex = videos.findIndex((v) => v.id === videoId);
			if (videoIndex === -1) {
				return fail(404, { message: 'Không tìm thấy video để xóa' });
			}

			const deletedVideo = videos[videoIndex];
			videos.splice(videoIndex, 1);
			const jsonContent = toJson(videos);

			try {
				await createOrUpdateFile(domainPath, jsonContent, `Delete video ${deletedVideo.title}`, {
					sha: remoteSha
				});
			} catch (githubError) {
				try {
					const fs = await import('node:fs/promises');
					const path = await import('node:path');
					await fs.writeFile(path.resolve(process.cwd(), domainPath), jsonContent, 'utf-8');
				} catch (localWriteError) {
					throw githubError;
				}
			}

			throw redirect(303, '/admin/videos');
		} catch (error) {
			if (isRedirect(error)) throw error;
			console.error('Failed to delete video', error);
			return fail(500, { message: 'Không thể xóa video' });
		}
	}
};