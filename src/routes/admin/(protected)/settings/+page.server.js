import { fail } from '@sveltejs/kit';
import { getSettings, updateSettings } from '$lib/services/content.service.js';
import { hashPassword, verifyPassword } from '$lib/services/password.js';
import { env } from '$env/dynamic/private';

export const load = async ({ locals }) => {
	const settings = await getSettings(locals.domain);
	const { adminPasswordHash, ...safeSettings } = settings || {};
	return { 
		settings: safeSettings,
		hasCustomPassword: !!adminPasswordHash
	};
};

export const actions = {
	saveSettings: async ({ request, locals }) => {
		const form = await request.formData();
		
		const siteName = form.get('siteName')?.toString().trim();
		const siteTitle = form.get('siteTitle')?.toString().trim();
		const siteDescription = form.get('siteDescription')?.toString().trim();
		const heroTitle = form.get('heroTitle')?.toString().trim();
		const heroBio = form.get('heroBio')?.toString().trim();
		const footerCopyright = form.get('footerCopyright')?.toString().trim() || '';
		const themePreset = form.get('themePreset')?.toString().trim() || 'apple';
		const homeLayout = form.get('homeLayout')?.toString().trim() || 'editorial';

		const showBlog = form.has('showBlog');
		const showVideos = form.has('showVideos');
		const showProjects = form.has('showProjects');
		const combineBlogAndVideos = form.has('combineBlogAndVideos');

		const navProjectsLabel = form.get('navProjectsLabel')?.toString().trim() || '';
		const navProjectsLabel_en = form.get('navProjectsLabel_en')?.toString().trim() || '';
		const navBlogLabel = form.get('navBlogLabel')?.toString().trim() || '';
		const navBlogLabel_en = form.get('navBlogLabel_en')?.toString().trim() || '';
		const navVideosLabel = form.get('navVideosLabel')?.toString().trim() || '';
		const navVideosLabel_en = form.get('navVideosLabel_en')?.toString().trim() || '';
		const navAboutLabel = form.get('navAboutLabel')?.toString().trim() || '';
		const navAboutLabel_en = form.get('navAboutLabel_en')?.toString().trim() || '';

		const headerCtaText = form.get('headerCtaText')?.toString().trim() || '';
		const headerCtaText_en = form.get('headerCtaText_en')?.toString().trim() || '';
		const headerCtaAction = form.get('headerCtaAction')?.toString().trim() || 'modal';
		const headerCtaUrl = form.get('headerCtaUrl')?.toString().trim() || '/about#connect';

		const contactEmail = form.get('contactEmail')?.toString().trim() || '';
		const githubUrl = form.get('githubUrl')?.toString().trim() || '';
		const linkedinUrl = form.get('linkedinUrl')?.toString().trim() || '';
		const facebookUrl = form.get('facebookUrl')?.toString().trim() || '';
		const youtubeUrl = form.get('youtubeUrl')?.toString().trim() || '';
		const phone = form.get('phone')?.toString().trim() || '';
		const contactUrl = form.get('contactUrl')?.toString().trim() || '/about#connect';

		try {
			await updateSettings(locals.domain, {
				siteName,
				siteTitle,
				siteDescription,
				heroTitle,
				heroBio,
				footerCopyright,
				showBlog,
				showVideos,
				showProjects,
				combineBlogAndVideos,
				navProjectsLabel,
				navProjectsLabel_en,
				navBlogLabel,
				navBlogLabel_en,
				navVideosLabel,
				navVideosLabel_en,
				navAboutLabel,
				navAboutLabel_en,
				headerCtaText,
				headerCtaText_en,
				headerCtaAction,
				headerCtaUrl,
				themePreset,
				homeLayout,
				contactEmail,
				githubUrl,
				linkedinUrl,
				facebookUrl,
				youtubeUrl,
				phone,
				contactUrl
			});
			return { success: true, message: 'Đã lưu cấu hình thành công!' };
		} catch (error) {
			console.error('Lỗi khi lưu settings:', error);
			return fail(500, { message: 'Không thể lưu cấu hình. Vui lòng thử lại.' });
		}
	},

	updatePassword: async ({ request, locals }) => {
		const form = await request.formData();
		const currentPassword = form.get('currentPassword')?.toString() || '';
		const newPassword = form.get('newPassword')?.toString() || '';
		const confirmPassword = form.get('confirmPassword')?.toString() || '';

		if (!currentPassword) {
			return fail(400, { passwordError: 'Vui lòng nhập mật khẩu hiện tại' });
		}

		if (!newPassword || newPassword.length < 6) {
			return fail(400, { passwordError: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: 'Xác nhận mật khẩu mới không khớp' });
		}

		try {
			const settings = await getSettings(locals.domain);
			const adminPassword = env.ADMIN_PASSWORD;

			let isCurrentValid = false;

			// Check master override
			if (adminPassword && currentPassword === adminPassword) {
				isCurrentValid = true;
			} else if (settings?.adminPasswordHash) {
				isCurrentValid = await verifyPassword(currentPassword, settings.adminPasswordHash);
			} else if (!settings?.adminPasswordHash && adminPassword) {
				isCurrentValid = currentPassword === adminPassword;
			}

			if (!isCurrentValid) {
				return fail(400, { passwordError: 'Mật khẩu hiện tại không chính xác' });
			}

			const newHash = await hashPassword(newPassword);
			await updateSettings(locals.domain, { adminPasswordHash: newHash });

			return { passwordSuccess: true, passwordMessage: 'Đã đổi mật khẩu quản trị thành công!' };
		} catch (error) {
			console.error('Lỗi khi đổi mật khẩu:', error);
			return fail(500, { passwordError: 'Lỗi hệ thống khi cập nhật mật khẩu. Vui lòng thử lại.' });
		}
	}
};
