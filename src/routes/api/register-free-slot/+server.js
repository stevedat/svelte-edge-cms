// @ts-check
import { json } from '@sveltejs/kit';
import { saveLead } from '$lib/services/leads.server.js';

/** @type {Map<string, { count: number, resetTime: number }>} */
const ipLimitMap = new Map();

function isRateLimited(ip = 'unknown') {
	const now = Date.now();
	const record = ipLimitMap.get(ip);

	if (!record || now > record.resetTime) {
		ipLimitMap.set(ip, { count: 1, resetTime: now + 10 * 60 * 1000 }); // 10 minutes
		return false;
	}

	if (record.count >= 4) {
		return true; // Over 4 requests in 10 minutes
	}

	record.count += 1;
	return false;
}

/**
 * Helper to get localized API response message
 * @param {string} locale
 * @param {string} key
 */
function getApiMessage(locale, key) {
	const isEn = locale === 'en';
	/** @type {Record<string, string>} */
	const messages = {
		rateLimit: isEn ? 'Too many requests. Please try again in a few minutes.' : 'Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau vài phút.',
		success: isEn ? 'Registration successful! We will get in touch within 24 hours.' : 'Đăng ký thành công! Tôi sẽ liên hệ lại trong vòng 24 giờ.',
		invalidPhone: isEn ? 'Please provide a valid phone number (9-12 digits).' : 'Vui lòng nhập số điện thoại hợp lệ (từ 9 đến 12 chữ số).',
		invalidEmail: isEn ? 'Invalid email format.' : 'Địa chỉ email không đúng định dạng.',
		serverError: isEn ? 'An error occurred while processing. Please try again later.' : 'Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại sau.'
	};
	return messages[key] || messages.serverError;
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, getClientAddress, locals, url }) {
	try {
		const ip = getClientAddress ? getClientAddress() : 'unknown';
		const headerLang = request.headers.get('accept-language')?.startsWith('en') ? 'en' : 'vi';
		const queryLocale = url.searchParams.get('lang') || headerLang;

		if (isRateLimited(ip)) {
			return json(
				{ success: false, code: 'RATE_LIMITED', message: getApiMessage(queryLocale, 'rateLimit') },
				{ status: 429 }
			);
		}

		const body = await request.json();
		const { phone, email, name, field, note, source, website_trap, locale: bodyLocale } = body;
		const locale = bodyLocale || queryLocale;

		// 1. Honeypot anti-bot trap
		if (website_trap) {
			console.warn(`[Lead AntiSpam] Bot trapped from IP: ${ip}`);
			return json({ success: true, code: 'SUCCESS', message: getApiMessage(locale, 'success') });
		}

		// 2. Validate Phone (mandatory)
		const trimmedPhone = (phone || '').toString().trim();
		const digitsOnly = trimmedPhone.replace(/[^0-9]/g, '');

		if (!trimmedPhone || digitsOnly.length < 9 || digitsOnly.length > 12) {
			return json(
				{ success: false, code: 'INVALID_PHONE', message: getApiMessage(locale, 'invalidPhone') },
				{ status: 400 }
			);
		}

		// 3. Validate Email (if provided)
		const trimmedEmail = (email || '').toString().trim();
		if (trimmedEmail) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(trimmedEmail)) {
				return json(
					{ success: false, code: 'INVALID_EMAIL', message: getApiMessage(locale, 'invalidEmail') },
					{ status: 400 }
				);
			}
		}

		const domain = locals.domain || 'default';

		// 4. Save Lead
		const leadData = {
			phone: trimmedPhone,
			email: trimmedEmail,
			name: (name || '').toString().trim(),
			field: (field || '').toString().trim(),
			note: (note || '').toString().trim(),
			source: (source || 'website').toString().trim(),
			ip
		};

		try {
			await saveLead(domain, leadData);
		} catch (err) {
			console.error('[Lead] Save lead error:', err);
		}

		return json({
			success: true,
			code: 'SUCCESS',
			message: getApiMessage(locale, 'success')
		});
	} catch (error) {
		console.error('[Lead API Error]:', error);
		return json(
			{ success: false, code: 'SERVER_ERROR', message: getApiMessage('vi', 'serverError') },
			{ status: 500 }
		);
	}
}
