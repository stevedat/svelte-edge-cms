import { json } from '@sveltejs/kit';
import { createAntiSpamChallenge } from '$lib/services/antispam.server.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	const slug = url.searchParams.get('slug');
	if (!slug) {
		return json({ error: 'Thiếu tham số slug bài viết' }, { status: 400 });
	}

	try {
		const challengeData = await createAntiSpamChallenge(slug);
		return json({
			success: true,
			...challengeData
		});
	} catch (error) {
		console.error('Lỗi khi tạo mã bảo vệ chống bot:', error);
		return json({ error: 'Không thể tạo mã xác thực chống bot' }, { status: 500 });
	}
}
