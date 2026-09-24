import { getPostSummaries, getVideos } from '$lib/content.server.js';

export const load = async ({ locals }) => {
	const domain = locals.domain || 'default';
	const [posts, videos] = await Promise.all([
		getPostSummaries(domain),
		getVideos(domain)
	]);

	return {
		posts,
		videos
	};
};
