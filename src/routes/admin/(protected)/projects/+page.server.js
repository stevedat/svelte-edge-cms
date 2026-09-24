// @ts-check
import { fail } from '@sveltejs/kit';
import { getProjects, deleteProject, saveProjects } from '$lib/services/content.service.js';

/**
 * @param {unknown} data
 */
const toJson = (data) => `${JSON.stringify(data, null, 2)}\n`;

export const load = async ({ locals }) => {
	let projects = [];
	try {
		const result = await getProjects(locals.domain, { limit: 100 });
		projects = result.projects;
	} catch (error) {
		console.error('projects load error', error);
	}
	
	return {
		projects,
		projectsJson: toJson(projects),
		sha: null
	};
};

export const actions = {
	updateJson: async ({ request, locals }) => {
		const form = await request.formData();
		const projects = form.get('projects')?.toString();

		if (!projects) {
			return fail(400, { message: 'Nhập dữ liệu projects' });
		}

		let parsed;
		try {
			parsed = JSON.parse(projects);
		} catch (error) {
			const details = error instanceof Error ? error.message : 'Unknown error';
			return fail(400, { message: 'JSON không hợp lệ', details });
		}
		
		try {
			await saveProjects(locals.domain, parsed);
			return { success: true };
		} catch (error) {
			console.error('Failed to update projects JSON:', error);
			const details = error instanceof Error ? error.message : 'Unknown error';
			return fail(500, { message: 'Không thể cập nhật danh sách dự án', details });
		}
	},

	delete: async ({ request, locals }) => {
		const form = await request.formData();
		const projectId = form.get('id')?.toString()?.trim();

		if (!projectId) {
			return fail(400, { message: 'Thiếu ID project' });
		}

		try {
			await deleteProject(locals.domain, projectId);
			return { success: true, message: 'Đã xóa dự án thành công' };
		} catch (error) {
			console.error('Failed to delete project', error);
			const message = error instanceof Error ? error.message : 'Không thể xóa project';
			return fail(500, { message });
		}
	}
};
