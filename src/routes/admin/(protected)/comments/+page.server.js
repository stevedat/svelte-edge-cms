import { fail } from '@sveltejs/kit';
import { getAllComments, deleteComment } from '$lib/services/comment.service.js';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals }) => {
	const comments = await getAllComments(locals.domain);
	return {
		comments
	};
};

/** @type {import('./$types').Actions} */
export const actions = {
	delete: async ({ request, locals }) => {
		const formData = await request.formData();
		const slug = formData.get('slug')?.toString();
		const id = formData.get('id')?.toString();

		if (!slug || !id) {
			return fail(400, { message: 'Thiếu thông tin bình luận cần xoá' });
		}

		try {
			const success = await deleteComment(locals.domain, slug, id);
			if (!success) {
				return fail(404, { message: 'Không tìm thấy bình luận để xoá' });
			}
			return { success: true, message: 'Đã xoá bình luận thành công' };
		} catch (error) {
			console.error('Lỗi khi xoá bình luận:', error);
			return fail(500, { message: 'Lỗi khi xoá bình luận, vui lòng thử lại' });
		}
	}
};
