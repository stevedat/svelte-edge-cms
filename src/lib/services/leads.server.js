// @ts-check
import { getFile, createOrUpdateFile, isGitHubConfigured } from './github.server.js';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * @typedef {'NEW' | 'CONTACTED' | 'CONFIRMED' | 'CANCELLED'} LeadStatus
 * 
 * @typedef {Object} Lead
 * @property {string} id
 * @property {string} phone
 * @property {string} [email]
 * @property {string} [name]
 * @property {string} [field]
 * @property {string} [note]
 * @property {string} [source]
 * @property {LeadStatus} [status]
 * @property {string} [adminNote]
 * @property {string} createdAt
 * @property {string} [updatedAt]
 * @property {string} [ip]
 */

/**
 * Lưu đăng ký lead mới
 * @param {string} domain
 * @param {Omit<Lead, 'id' | 'createdAt'>} leadData
 * @returns {Promise<Lead>}
 */
export async function saveLead(domain = 'default', leadData) {
	const id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
	const createdAt = new Date().toISOString();

	/** @type {Lead} */
	const newLead = {
		id,
		phone: leadData.phone,
		email: leadData.email || '',
		name: leadData.name || '',
		field: leadData.field || '',
		note: leadData.note || '',
		source: leadData.source || 'website',
		status: leadData.status || 'NEW',
		adminNote: leadData.adminNote || '',
		ip: leadData.ip || '',
		createdAt
	};

	const filePath = `src/content/${domain}/leads.json`;

	// 1. Thử lưu vào filesystem cục bộ
	try {
		const localFullPath = path.resolve(process.cwd(), filePath);
		let existingLeads = [];
		try {
			const content = await fs.readFile(localFullPath, 'utf-8');
			existingLeads = JSON.parse(content);
			if (!Array.isArray(existingLeads)) existingLeads = [];
		} catch {
			existingLeads = [];
		}
		existingLeads.unshift(newLead);
		await fs.mkdir(path.dirname(localFullPath), { recursive: true });
		await fs.writeFile(localFullPath, JSON.stringify(existingLeads, null, 2), 'utf-8');
	} catch (fsErr) {
		console.warn('[Leads] Filesystem save failed (might be serverless readonly):', /** @type {any} */ (fsErr).message);
	}

	// 2. Thử lưu vào GitHub nếu cấu hình
	if (isGitHubConfigured) {
		try {
			const file = await getFile(filePath);
			let existingLeads = [];
			let sha = undefined;
			if (file && file.content) {
				try {
					existingLeads = JSON.parse(file.content);
					if (!Array.isArray(existingLeads)) existingLeads = [];
				} catch {
					existingLeads = [];
				}
				sha = file.sha;
			}
			existingLeads.unshift(newLead);
			await createOrUpdateFile(
				filePath,
				JSON.stringify(existingLeads, null, 2),
				`feat(leads): new registration from ${newLead.phone} [skip ci]`,
				{ sha }
			);
		} catch (ghErr) {
			console.warn('[Leads] GitHub save failed:', /** @type {any} */ (ghErr).message);
		}
	}

	return newLead;
}

/**
 * Lấy danh sách leads đã đăng ký
 * @param {string} [domain]
 * @returns {Promise<Lead[]>}
 */
export async function getLeads(domain = 'default') {
	const filePath = `src/content/${domain}/leads.json`;

	// 1. Thử đọc từ filesystem cục bộ
	try {
		const localFullPath = path.resolve(process.cwd(), filePath);
		const content = await fs.readFile(localFullPath, 'utf-8');
		const leads = JSON.parse(content);
		if (Array.isArray(leads)) {
			return leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		}
		return [];
	} catch (_) {
		// 2. Fallback đọc từ GitHub nếu có cấu hình
		if (isGitHubConfigured) {
			try {
				const file = await getFile(filePath);
				if (file && file.content) {
					const leads = JSON.parse(file.content);
					if (Array.isArray(leads)) {
						return leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
					}
				}
			} catch (ghErr) {
				console.warn('[Leads] GitHub read failed:', /** @type {any} */ (ghErr).message);
			}
		}
		return [];
	}
}

/**
 * Cập nhật thông tin/trạng thái lead
 * @param {string} domain
 * @param {string} leadId
 * @param {{ status?: LeadStatus, adminNote?: string }} updates
 * @returns {Promise<Lead | null>}
 */
export async function updateLead(domain = 'default', leadId, updates) {
	const filePath = `src/content/${domain}/leads.json`;
	let leads = await getLeads(domain);
	const index = leads.findIndex(l => l.id === leadId);
	if (index === -1) return null;

	leads[index] = {
		...leads[index],
		...updates,
		updatedAt: new Date().toISOString()
	};

	// 1. Thử lưu vào filesystem cục bộ
	try {
		const localFullPath = path.resolve(process.cwd(), filePath);
		await fs.mkdir(path.dirname(localFullPath), { recursive: true });
		await fs.writeFile(localFullPath, JSON.stringify(leads, null, 2), 'utf-8');
	} catch (fsErr) {
		console.warn('[Leads] Filesystem save failed:', /** @type {any} */ (fsErr).message);
	}

	// 2. Thử lưu vào GitHub nếu cấu hình
	if (isGitHubConfigured) {
		try {
			const file = await getFile(filePath);
			await createOrUpdateFile(
				filePath,
				JSON.stringify(leads, null, 2),
				`chore(leads): update lead ${leadId} [skip ci]`,
				{ sha: file?.sha }
			);
		} catch (ghErr) {
			console.warn('[Leads] GitHub save failed:', /** @type {any} */ (ghErr).message);
		}
	}

	return leads[index];
}

/**
 * Xóa lead
 * @param {string} domain
 * @param {string} leadId
 * @returns {Promise<boolean>}
 */
export async function deleteLead(domain = 'default', leadId) {
	const filePath = `src/content/${domain}/leads.json`;
	let leads = await getLeads(domain);
	const initialLength = leads.length;
	leads = leads.filter(l => l.id !== leadId);
	if (leads.length === initialLength) return false;

	// 1. Thử lưu vào filesystem cục bộ
	try {
		const localFullPath = path.resolve(process.cwd(), filePath);
		await fs.mkdir(path.dirname(localFullPath), { recursive: true });
		await fs.writeFile(localFullPath, JSON.stringify(leads, null, 2), 'utf-8');
	} catch (fsErr) {
		console.warn('[Leads] Filesystem save failed:', /** @type {any} */ (fsErr).message);
	}

	// 2. Thử lưu vào GitHub nếu cấu hình
	if (isGitHubConfigured) {
		try {
			const file = await getFile(filePath);
			await createOrUpdateFile(
				filePath,
				JSON.stringify(leads, null, 2),
				`chore(leads): delete lead ${leadId} [skip ci]`,
				{ sha: file?.sha }
			);
		} catch (ghErr) {
			console.warn('[Leads] GitHub save failed:', /** @type {any} */ (ghErr).message);
		}
	}

	return true;
}
