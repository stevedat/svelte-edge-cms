// @ts-check
import { env } from '$env/dynamic/private';

/**
 * Multi-layer Anti-Bot & Anti-Spam Protection Service
 * Built with standard Web Crypto API (100% Edge / Serverless compatible, zero dependencies)
 */

const POW_DIFFICULTY = '000'; // 3 leading hex zeros (~4096 iterations, ~10-25ms in browser, 0.001ms on server)
const MIN_SUBMISSION_TIME_MS = 3000; // 3 seconds minimum (human typing speed gate)
const MAX_TOKEN_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours token expiry
const RATE_LIMIT_COOLDOWN_MS = 15 * 1000; // 15 seconds cooldown between comments from same IP
const RATE_LIMIT_BURST_MAX = 5; // Max 5 comments per window
const RATE_LIMIT_BURST_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/** @type {Map<string, { lastTime: number, count: number, windowStart: number }>} */
const ipRateLimitMap = new Map();

/**
 * Standard Web-compatible base64url encoding
 * @param {string} str
 * @returns {string}
 */
function toBase64Url(str) {
	return btoa(unescape(encodeURIComponent(str)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

/**
 * Standard Web-compatible base64url decoding
 * @param {string} b64
 * @returns {string}
 */
function fromBase64Url(b64) {
	let str = b64.replace(/-/g, '+').replace(/_/g, '/');
	while (str.length % 4) str += '=';
	return decodeURIComponent(escape(atob(str)));
}

/**
 * Get internal cryptographic secret key for signing anti-spam tokens
 * @returns {Promise<CryptoKey>}
 */
async function getSigningKey() {
	const secretStr = env.ADMIN_PASSWORD || 'edge-cms-blog-antispam-salt-2026';
	const encoder = new TextEncoder();
	return await crypto.subtle.importKey(
		'raw',
		encoder.encode(secretStr),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify']
	);
}

/**
 * Generate a cryptographically signed anti-spam challenge
 * @param {string} slug
 * @returns {Promise<{ challenge: string; token: string; salt: string; difficulty: string; timestamp: number }>}
 */
export async function createAntiSpamChallenge(slug) {
	const timestamp = Date.now();
	const salt = Math.random().toString(36).substring(2, 10);
	const payload = `${slug}:${timestamp}:${salt}`;

	const key = await getSigningKey();
	const encoder = new TextEncoder();
	const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
	const sigHex = Array.from(new Uint8Array(signatureBuffer))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');

	// token format: payload.signature
	const token = `${toBase64Url(payload)}.${sigHex}`;
	const challenge = `${slug}_${salt}_${timestamp}`;

	return {
		challenge,
		token,
		salt,
		difficulty: POW_DIFFICULTY,
		timestamp
	};
}

/**
 * Verify anti-spam token signature and timestamp
 * @param {string} slug
 * @param {string} token
 * @returns {Promise<{ valid: boolean; timestamp?: number; error?: string }>}
 */
async function verifyToken(slug, token) {
	if (!token || typeof token !== 'string') {
		return { valid: false, error: 'Missing bot authentication code' };
	}

	const parts = token.split('.');
	if (parts.length !== 2) {
		return { valid: false, error: 'Bot authentication code is malformed' };
	}

	const [payloadB64, sigHex] = parts;
	let payload = '';
	try {
		payload = fromBase64Url(payloadB64);
	} catch {
		return { valid: false, error: 'Invalid authentication code' };
	}

	const payloadParts = payload.split(':');
	if (payloadParts.length !== 3) {
		return { valid: false, error: 'Invalid authentication data' };
	}

	const [tokenSlug, tokenTimeStr] = payloadParts;
	if (tokenSlug !== slug) {
		return { valid: false, error: 'Authentication code does not match the article' };
	}

	const tokenTime = parseInt(tokenTimeStr, 10);
	if (isNaN(tokenTime)) {
		return { valid: false, error: 'Invalid authentication time' };
	}

	const now = Date.now();
	// Check Time-Gate: too fast (< 3 seconds)
	if (now - tokenTime < MIN_SUBMISSION_TIME_MS) {
		return { 
			valid: false, 
			error: 'Action too fast (suspected bot). Please wait at least 3 seconds.' 
		};
	}

	// Check Token Expiry: too old (> 24 hours)
	if (now - tokenTime > MAX_TOKEN_AGE_MS) {
		return { 
			valid: false, 
			error: 'Comment submission session has expired. Please reload the page to resubmit.' 
		};
	}

	// Verify HMAC signature
	try {
		const key = await getSigningKey();
		const encoder = new TextEncoder();
		const sigBytes = new Uint8Array(
			sigHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
		);

		const isVerified = await crypto.subtle.verify(
			'HMAC',
			key,
			sigBytes,
			encoder.encode(payload)
		);

		if (!isVerified) {
			return { valid: false, error: 'Invalid authentication signature' };
		}
	} catch {
		return { valid: false, error: 'Cannot verify security signature' };
	}

	return { valid: true, timestamp: tokenTime };
}

/**
 * Verify Proof-of-Work (PoW) solution
 * @param {string} challenge
 * @param {number|string} nonce
 * @returns {Promise<boolean>}
 */
export async function verifyPoW(challenge, nonce) {
	if (nonce === undefined || nonce === null) return false;
	try {
		const encoder = new TextEncoder();
		const data = encoder.encode(challenge + nonce);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = new Uint8Array(hashBuffer);
		
		// Check if first 3 hex characters are '000' (byte 0 is 0, byte 1 < 16)
		return hashArray[0] === 0 && hashArray[1] < 16;
	} catch {
		return false;
	}
}

/**
 * Filter and inspect comment content for spam heuristics
 * @param {string} content
 * @returns {{ pass: boolean; reason?: string }}
 */
export function inspectCommentContent(content) {
	if (!content || content.trim().length < 2) {
		return { pass: false, reason: 'Comment content is too short.' };
	}

	const clean = content.trim();

	// 1. Link spam check (max 1 URL allowed in legitimate comments)
	const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
	const urls = clean.match(urlRegex) || [];
	if (urls.length > 1) {
		return { 
			pass: false, 
			reason: 'Comments can only contain a maximum of 1 link to prevent spam advertising.' 
		};
	}

	// 2. BBCode or HTML tag injection
	const tagRegex = /\[url[\s=\]]|\[link[\s=\]]|<a\s|<script|<iframe|\[b\]|\[img\]/i;
	if (tagRegex.test(clean)) {
		return { 
			pass: false, 
			reason: 'Please do not use HTML or BBCode tags in comments.' 
		};
	}

	// 3. Obvious spam keywords (Casino, betting, scam keywords in VN/EN)
	const spamKeywords = [
		'kubet', 'thabet', 'nhà cái', 'nha cai', 'keonhacai', 'soi cầu', 'soi cau', 
		'tai xiu', 'tài xỉu', 'đá gà', 'da ga', 'casino online', 'lô đề', 'lo de',
		'crypto airdrop', 'wa.me/', 'whatsapp:', 'viagra'
	];
	const lower = clean.toLowerCase();
	for (const keyword of spamKeywords) {
		if (lower.includes(keyword)) {
			return { 
				pass: false, 
				reason: 'Comment contains restricted keywords to protect content integrity.' 
			};
		}
	}

	// 4. Excessive repetitive characters (e.g. 'aaaaaaaaaa' or '!!!!!!!!!!')
	const repeatRegex = /(.)\1{9,}/;
	if (repeatRegex.test(clean)) {
		return { 
			pass: false, 
			reason: 'Comment contains unusual repetitive character strings.' 
		};
	}

	return { pass: true };
}

/**
 * Rate limit check for IP
 * @param {string} ip
 * @returns {{ allowed: boolean; retryAfter?: number }}
 */
export function checkRateLimit(ip) {
	const now = Date.now();
	const record = ipRateLimitMap.get(ip);

	if (!record) {
		ipRateLimitMap.set(ip, { lastTime: now, count: 1, windowStart: now });
		return { allowed: true };
	}

	// Check immediate cooldown (15s)
	const elapsedSinceLast = now - record.lastTime;
	if (elapsedSinceLast < RATE_LIMIT_COOLDOWN_MS) {
		const retryAfter = Math.ceil((RATE_LIMIT_COOLDOWN_MS - elapsedSinceLast) / 1000);
		return { allowed: false, retryAfter };
	}

	// Check burst window (10 mins)
	if (now - record.windowStart > RATE_LIMIT_BURST_WINDOW_MS) {
		// Reset window
		record.windowStart = now;
		record.count = 1;
		record.lastTime = now;
		return { allowed: true };
	}

	if (record.count >= RATE_LIMIT_BURST_MAX) {
		const retryAfter = Math.ceil((RATE_LIMIT_BURST_WINDOW_MS - (now - record.windowStart)) / 1000);
		return { allowed: false, retryAfter };
	}

	record.count += 1;
	record.lastTime = now;

	// Clean up table periodically if too large
	if (ipRateLimitMap.size > 1000) {
		for (const [k, v] of ipRateLimitMap.entries()) {
			if (now - v.lastTime > RATE_LIMIT_BURST_WINDOW_MS) {
				ipRateLimitMap.delete(k);
			}
		}
	}

	return { allowed: true };
}

/**
 * Comprehensive verification of a comment submission
 * @param {object} params
 * @param {string} params.slug
 * @param {string} params.content
 * @param {Record<string, any>} [params.honeypots]
 * @param {string} [params.token]
 * @param {number|string} [params.nonce]
 * @param {string} params.ip
 * @param {boolean} [params.isAdmin]
 * @returns {Promise<{ isValid: boolean; silentDrop?: boolean; error?: string; status?: number }>}
 */
export async function verifyCommentSubmission({
	slug,
	content,
	honeypots = {},
	token,
	nonce,
	ip,
	isAdmin = false
}) {
	// 1. Admin bypass
	if (isAdmin) {
		return { isValid: true };
	}

	// 2. Honeypot check (Silent Drop / Blackhole)
	// If any honeypot trap field is filled, pretend it succeeded but drop it!
	for (const [key, val] of Object.entries(honeypots)) {
		if (val && typeof val === 'string' && val.trim().length > 0) {
			console.warn(`[AntiSpam] Honeypot triggered (${key}) from IP: ${ip}`);
			return { isValid: false, silentDrop: true };
		}
	}

	// 3. Rate limiting by IP
	const rateCheck = checkRateLimit(ip);
	if (!rateCheck.allowed) {
		return {
			isValid: false,
			status: 429,
			error: `You are submitting comments too frequently. Please try again in ${rateCheck.retryAfter} seconds.`
		};
	}

	// 4. Token & Time-Gate validation
	if (!token) {
		return {
			isValid: false,
			status: 400,
			error: 'Missing bot authentication code. Please refresh the page.'
		};
	}

	const tokenCheck = await verifyToken(slug, token);
	if (!tokenCheck.valid) {
		return {
			isValid: false,
			status: 400,
			error: tokenCheck.error
		};
	}

	// Extract salt from token payload for PoW check
	const [payloadB64] = token.split('.');
	let salt = '';
	let timestamp = 0;
	try {
		const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
		const parts = payload.split(':');
		timestamp = parseInt(parts[1], 10);
		salt = parts[2];
	} catch {
		return { isValid: false, status: 400, error: 'Invalid token' };
	}

	// 5. Proof-of-Work (PoW) verification
	if (!nonce) {
		return {
			isValid: false,
			status: 403,
			error: 'Browser authentication failed (Proof-of-Work failed). Please try again.'
		};
	}
	const challenge = `${slug}_${salt}_${timestamp}`;
	const isPoWValid = await verifyPoW(challenge, nonce);
	if (!isPoWValid) {
		return {
			isValid: false,
			status: 403,
			error: 'Browser authentication failed (Proof-of-Work failed). Please try again.'
		};
	}

	// 6. Content heuristics filter
	const contentCheck = inspectCommentContent(content);
	if (!contentCheck.pass) {
		return {
			isValid: false,
			status: 400,
			error: contentCheck.reason
		};
	}

	return { isValid: true };
}
