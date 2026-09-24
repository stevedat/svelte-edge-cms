import { error, fail, redirect, isRedirect } from '@sveltejs/kit';
import { getPost, updatePost } from '$lib/services/content.service.js';
import { uploadImage } from '$lib/services/github.server.js';
import { slugify } from '$lib/utils.js';

export const load = async ({ params, locals }) => {
	const slug = decodeURIComponent(params.slug);
	const domain = locals.domain || 'default';
	
	try {
		const post = await getPost(domain, slug, false);
		if (!post) throw error(404, 'Không tìm thấy bài viết');
		
		return {
			post: {
				slug: post.slug,
				title: post.title,
				date: (post.publishedAt || post.createdAt || new Date().toISOString()).slice(0, 10),
				tags: post.tags || post.tagSlugs || [],
				thumbnail: post.thumbnail || '',
				content: post.content || ''
			}
		};
	} catch (err) {
		console.error('Error loading post:', err);
		throw error(404, 'Không tìm thấy bài viết');
	}
};

export const actions = {
	default: async ({ request, params, locals }) => {
		const form = await request.formData();
		const originalSlug = decodeURIComponent(params.slug);
		
		const title = form.get('title')?.toString().trim();
		const slugInput = form.get('slug')?.toString().trim();
		const date = form.get('date')?.toString() ?? new Date().toISOString().slice(0, 10);
		const tagsInput = form.get('tags')?.toString() ?? '';
		const body = form.get('content')?.toString().trim();
		let thumbnail = form.get('thumbnail')?.toString().trim();
		const thumbnailFile = form.get('thumbnail_file');

		if (!title || !body) {
			return fail(400, { message: 'Cần tiêu đề và nội dung' });
		}

		try {
			if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
				thumbnail = await uploadImage(thumbnailFile);
			}

			const tagList = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);

			const targetSlug = slugInput ? slugify(slugInput) : originalSlug;

			const domain = locals.domain || 'default';
			await updatePost(domain, originalSlug, {
				title,
				slug: targetSlug,
				content: body,
				excerpt: body.substring(0, 150) + '...',
				thumbnail: thumbnail || null,
				tags: tagList,
				publishedAt: new Date(date).toISOString(),
				status: 'PUBLISHED'
			}, locals.user?.id || 'admin');

			throw redirect(303, '/admin/posts');
			
		} catch (err) {
			if (isRedirect(err)) throw err;
			const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
			return fail(500, { message: 'Không thể cập nhật bài viết. Lỗi: ' + errorMessage });
		}
	}
};
