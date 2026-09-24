import { getVideos } from '$lib/content.server.js';

export const load = async ({ locals }) => ({
	videos: await getVideos(locals.domain)
});
