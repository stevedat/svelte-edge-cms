import { getSettings } from '$lib/services/content.service.js';

export const load = async ({ locals }) => {
	const domain = locals.domain || 'default';
	const settings = locals.settings || (await getSettings(domain));

	return {
		isAuthenticated: locals.isAuthenticated ?? false,
		domain,
		locale: locals.locale || 'vi',
		settings
	};
};
