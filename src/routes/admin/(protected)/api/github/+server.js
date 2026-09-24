import { error, json } from '@sveltejs/kit';
import { createOrUpdateFile, deleteFile, getFile, uploadImage } from '$lib/services/github.server.js';

export const POST = async ({ request }) => {
	const contentType = request.headers.get('content-type') ?? '';

	if (contentType.startsWith('multipart/form-data')) {
		const formData = await request.formData();
		const file = formData.get('file');

		if (!(file instanceof File)) {
			throw error(400, 'Thiếu file upload.');
		}

		const url = await uploadImage(file);
		return json({ url });
	}

	const body = await request.json();

	switch (body.action) {
		case 'read': {
			const file = await getFile(body.path);
			return json(file);
		}
		case 'write': {
			const result = await createOrUpdateFile(body.path, body.content, body.message ?? 'Update từ Admin', {
				sha: body.sha
			});
			return json(result);
		}
		default:
			throw error(400, 'Hành động không được hỗ trợ.');
	}
};

export const DELETE = async ({ request }) => {
	const body = await request.json();
	if (!body?.path || !body?.sha) {
		throw error(400, 'Thiếu path hoặc sha');
	}

	await deleteFile(body.path, body.sha, body.message ?? 'Delete từ Admin');
	return json({ success: true });
};
