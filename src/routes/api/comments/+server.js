import { json } from '@sveltejs/kit';
import { getPublicComments, addComment, sanitizePublicComment } from '$lib/services/comment.service.js';
import { getClientIP } from '$lib/auth.enhanced.js';
import { verifyCommentSubmission } from '$lib/services/antispam.server.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url, locals }) {
	const slug = url.searchParams.get('slug');
	if (!slug) {
		return json({ error: 'Missing slug parameter' }, { status: 400 });
	}

	try {
		const comments = await getPublicComments(locals.domain, slug);
		return json({ success: true, comments });
	} catch (error) {
		return json({ error: 'Không thể tải bình luận' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	try {
		const data = await request.json();
		const { 
			slug, 
			name, 
			email, 
			content, 
			honeypot, 
			website, 
			phone_number, 
			phone, 
			parentId, 
			token, 
			nonce 
		} = data;

		// 1. Basic payload validation
		if (!slug || typeof slug !== 'string') {
			return json({ error: 'Bài viết không hợp lệ' }, { status: 400 });
		}

		if (!name || typeof name !== 'string' || name.trim().length < 2) {
			return json({ error: 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự)' }, { status: 400 });
		}

		if (!content || typeof content !== 'string' || content.trim().length < 2) {
			return json({ error: 'Vui lòng nhập nội dung bình luận (tối thiểu 2 ký tự)' }, { status: 400 });
		}

		const isAuthor = Boolean(locals.isAuthenticated);
		const ip = getClientIP(request);

		// 2. Comprehensive Multi-layer Anti-Bot & Anti-Spam Check
		const check = await verifyCommentSubmission({
			slug,
			content,
			honeypots: {
				honeypot,
				website,
				phone_number: phone_number || phone
			},
			token,
			nonce,
			ip,
			isAdmin: isAuthor
		});

		// Silent drop bot submissions (return fake 200 OK without committing to GitHub)
		if (check.silentDrop) {
			return json({
				success: true,
				message: 'Bình luận của bạn đã được đăng thành công!'
			});
		}

		if (!check.isValid) {
			return json({ 
				error: check.error || 'Yêu cầu không hợp lệ' 
			}, { 
				status: check.status || 400 
			});
		}

		// 3. Save comment to Git-backed storage
		const newComment = await addComment(locals.domain, slug, {
			name: name.trim(),
			email: email?.trim(),
			content: content.trim(),
			parentId: parentId ? String(parentId) : undefined,
			isAuthor
		});

		return json({
			success: true,
			comment: sanitizePublicComment(newComment),
			message: 'Bình luận của bạn đã được đăng thành công!'
		});
	} catch (error) {
		console.error('Lỗi khi thêm bình luận:', error);
		return json({
			error: /** @type {any} */ (error).message || 'Không thể gửi bình luận, vui lòng thử lại sau.'
		}, { status: 500 });
	}
}
