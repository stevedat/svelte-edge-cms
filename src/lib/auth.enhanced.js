// @ts-check
import { getUserByToken, logoutUser } from '$lib/services/auth.service.js';

/**
 * Enhanced authentication middleware for SvelteKit with Supabase Auth
 */

/**
 * Extract token from request headers or cookies
 * @param {Request} request
 * @param {any} cookies
 * @returns {string|null}
 */
function extractToken(request, cookies) {
	// Try Authorization header first (for API requests)
	const authHeader = request.headers.get('authorization');
	if (authHeader && authHeader.startsWith('Bearer ')) {
		return authHeader.substring(7);
	}

	// Try cookie (for web requests)
	const cookieToken = cookies.get('sb-access-token') || cookies.get('auth-token');
	if (cookieToken) {
		return cookieToken;
	}

	return null;
}

/**
 * Get current user from request using Supabase Auth
 * @param {Request} request
 * @param {any} cookies
 * @returns {Promise<any|null>}
 */
export async function getCurrentUser(request, cookies) {
	const token = extractToken(request, cookies);
	if (!token) return null;

	return await getUserByToken(token);
}

/**
 * Require authentication middleware
 * @param {Request} request
 * @param {any} cookies
 * @param {string[]} [allowedRoles] - Optional role restrictions
 * @returns {Promise<{user: any} | {redirect: string}>}
 */
export async function requireAuth(request, cookies, allowedRoles = []) {
	const user = await getCurrentUser(request, cookies);
	
	if (!user) {
		return { redirect: '/admin/login' };
	}

	// Check role permissions if specified
	if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
		return { redirect: '/admin/unauthorized' };
	}

	return { user };
}

/**
 * Check if user has permission for specific action
 * @param {any} user
 * @param {string} action - CREATE, READ, UPDATE, DELETE
 * @param {string} resource - posts, videos, projects, users, etc.
 * @returns {boolean}
 */
export function hasPermission(user, action, resource) {
	if (!user) return false;

	const { role } = user;

	// Super admin can do everything
	if (role === 'SUPER_ADMIN') return true;

	// Admin permissions
	if (role === 'ADMIN') {
		// Admins can manage all content but not other admins
		if (resource === 'users') {
			return action === 'READ' || action === 'CREATE';
		}
		return true;
	}

	// Editor permissions
	if (role === 'EDITOR') {
		if (resource === 'users') return action === 'READ';
		if (resource === 'settings') return action === 'READ';
		return ['posts', 'videos', 'projects', 'media', 'categories', 'tags'].includes(resource);
	}

	// Author permissions
	if (role === 'AUTHOR') {
		if (resource === 'users') return action === 'READ';
		if (['categories', 'tags'].includes(resource)) return action === 'READ';
		return ['posts', 'videos', 'projects', 'media'].includes(resource);
	}

	// Viewer permissions
	if (role === 'VIEWER') {
		return action === 'READ';
	}

	return false;
}

/**
 * Create auth session cookie for Supabase
 * @param {string} token
 * @returns {{name: string, value: string, options: any}}
 */
export function createAuthCookie(token) {
	return {
		name: 'sb-access-token',
		value: token,
		options: {
			httpOnly: true,
			secure: true, // Bắt buộc cho sameSite none
			sameSite: 'none', // Sửa từ lax thành none để chạy trong iframe IDE
			maxAge: 60 * 60 * 24 * 7, // 7 days
			path: '/'
		}
	};
}

/**
 * Clear auth session cookie
 * @returns {{name: string, value: string, options: any}}
 */
export function clearAuthCookie() {
	return {
		name: 'sb-access-token',
		value: '',
		options: {
			httpOnly: true,
			secure: true,
			sameSite: 'none',
			maxAge: 0,
			path: '/'
		}
	};
}

/**
 * Logout and clear session using Supabase Auth
 * @param {Request} request
 * @param {any} cookies
 * @returns {Promise<boolean>}
 */
export async function logout(request, cookies) {
	const token = extractToken(request, cookies);
	const userAgent = request.headers.get('user-agent') || undefined;
	const ipAddress = request.headers.get('x-forwarded-for') || 
					  request.headers.get('x-real-ip') || 
					  undefined;

	if (token) {
		return await logoutUser(token, userAgent, ipAddress);
	}
	return true;
}

/**
 * Get client IP address
 * @param {Request} request
 * @returns {string}
 */
export function getClientIP(request) {
	return request.headers.get('x-forwarded-for') || 
		   request.headers.get('x-real-ip') || 
		   request.headers.get('cf-connecting-ip') ||
		   'unknown';
}

/**
 * Get user agent
 * @param {Request} request
 * @returns {string}
 */
export function getUserAgent(request) {
	return request.headers.get('user-agent') || 'unknown';
}