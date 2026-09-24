// @ts-check
import { fail } from '@sveltejs/kit';
import { createOrUpdateFile, getFile } from '$lib/services/github.server.js';

/**
 * @param {unknown} data
 */
const toJson = (data) => `${JSON.stringify(data, null, 2)}\n`;

import { getVideos } from '$lib/services/content.service.js';

export const load = async ({ locals }) => {
	try {
		const { videos } = await getVideos(locals.domain, { limit: 100 });
		return { videos };
	} catch (error) {
		console.error('Failed to load videos', error);
		return { videos: [] };
	}
};

export const actions = {
	delete: async ({ request, locals }) => {
		const form = await request.formData();
		const videoId = form.get('id')?.toString();
		const domainPath = `src/content/${locals.domain || 'default'}/videos.json`;

		if (!videoId) {
			return fail(400, { message: 'Thiếu ID video' });
		}

		try {
			const remote = await getFile(domainPath);
			/** @type {any[]} */
			let videos = [];
			
			if (remote?.content) {
				try {
					videos = JSON.parse(remote.content);
				} catch (parseError) {
					return fail(500, { message: 'videos.json hiện không hợp lệ' });
				}
			}

			const videoIndex = videos.findIndex((v) => v.id === videoId);
			if (videoIndex === -1) {
				return fail(404, { message: 'Không tìm thấy video để xóa' });
			}

			const deletedVideo = videos[videoIndex];
			videos.splice(videoIndex, 1);

			await createOrUpdateFile(domainPath, toJson(videos), `Delete video ${deletedVideo.title}`, {
				sha: remote?.sha
			});

			return { success: true, message: `Đã xóa video "${deletedVideo.title}"` };
		} catch (error) {
			console.error('Failed to delete video', error);
			return fail(500, { message: 'Không thể xóa video' });
		}
	}
};
