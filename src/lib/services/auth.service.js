// @ts-check
import { SignJWT, jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';

const JWT_SECRET = env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN || '7d';
const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} email
 * @property {string} username
 * @property {string} name
 * @property {string} role
 * @property {string} avatar
 * @property {boolean} isActive
 */

/**
 * @typedef {Object} LoginResult
 * @property {boolean} success
 * @property {AuthUser} [user]
 * @property {string} [token]
 * @property {string} [message]
 */

/**
 * Generate JWT token
 * @param {{id: string, email: string, username: string, role: string}} user
 * @returns {Promise<string>}
 */
export async function generateToken(user) {
	return await new SignJWT({
			id: user.id, 
			email: user.email, 
			username: user.username,
			role: user.role 
		})
		.setProtectedHeader({ alg: 'HS256' })
		.setExpirationTime(JWT_EXPIRES_IN)
		.sign(secretKey);
}

/**
 * Verify JWT token
 * @param {string} token
 * @returns {Promise<Object|null>}
 */
export async function verifyToken(token) {
	try {
		const { payload } = await jwtVerify(token, secretKey);
		return payload;
	} catch (error) {
		return null;
	}
}

import { verifyPassword } from './password.js';
import { getSettings } from './content.service.js';

/**
 * Login user using tenant-specific password or system ADMIN_PASSWORD
 * @param {string} identifier - Email or username
 * @param {string} password
 * @param {string} [domain] - Tenant domain
 * @param {string} [userAgent]
 * @param {string} [ipAddress]
 * @returns {Promise<LoginResult>}
 */
export async function loginUser(identifier, password, domain = 'default', userAgent, ipAddress) {
	try {
		console.log('Login attempt for domain:', domain, 'identifier:', identifier);

		// 1. MASTER OVERRIDE:
		// If password matches ADMIN_PASSWORD in environment, master admin always has access
		const adminPassword = env.ADMIN_PASSWORD;
		console.log('adminPassword from env:', adminPassword, 'password entered:', password);
		if (adminPassword && password === adminPassword) {
			const authUser = {
				id: 'admin',
				email: 'admin@system.local',
				username: 'admin',
				name: 'Master Admin',
				role: 'ADMIN',
				avatar: '',
				isActive: true
			};
			const token = await generateToken(authUser);
			return { success: true, user: authUser, token };
		}

		// 2. TENANT-SPECIFIC PASSWORD:
		// Check against password stored in src/content/{domain}/settings.json
		try {
			const settings = await getSettings(domain);
			if (settings?.adminPasswordHash) {
				const isValid = await verifyPassword(password, settings.adminPasswordHash);
				if (isValid) {
					const authUser = {
						id: `tenant_${domain}`,
						email: settings.contactEmail || `admin@${domain}`,
						username: domain,
						name: settings.siteName || domain,
						role: 'ADMIN',
						avatar: '',
						isActive: true
					};
					const token = await generateToken(authUser);
					return { success: true, user: authUser, token };
				}
			}
		} catch (err) {
			console.warn('Error verifying tenant password:', err);
		}

		return { success: false, message: 'Incorrect password' };
	} catch (error) {
		console.error('Login error:', error);
		return { success: false, message: 'System error, vui lòng thử lại' };
	}
}

/**
 * Logout user 
 * @param {string} token
 * @param {string} [userAgent]
 * @param {string} [ipAddress]
 * @returns {Promise<boolean>}
 */
export async function logoutUser(token, userAgent, ipAddress) {
	// Since we are not storing sessions in DB anymore, logout is handled by client clearing cookie
	return true;
}

/**
 * Get user by token
 * @param {string} token
 * @returns {Promise<AuthUser|null>}
 */
export async function getUserByToken(token) {
	try {
		const { payload: decoded } = await jwtVerify(token, secretKey);
		if (decoded) {
			return {
				// @ts-ignore
				id: decoded.id,
				// @ts-ignore
				email: decoded.email,
				// @ts-ignore
				username: decoded.username,
				// @ts-ignore
				name: decoded.name || 'Admin',
				// @ts-ignore
				role: decoded.role,
				avatar: '',
				isActive: true
			};
		}
		return null;
	} catch (error) {
		return null;
	}
}