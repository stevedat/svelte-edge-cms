import { getProjects } from '$lib/content.server.js';

export const load = async ({ locals }) => ({
	projects: await getProjects(locals.domain)
});
