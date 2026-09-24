// @ts-check

/**
 * Hashes a password using PBKDF2-SHA256 with a random salt.
 * 100% Web Crypto API compatible (Node.js 18+, Vercel Edge, Cloudflare Workers).
 * 
 * @param {string} password
 * @returns {Promise<string>} Format: "pbkdf2:salt_hex:hash_hex"
 */
export async function hashPassword(password) {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
	
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(password),
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);

	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt,
			iterations: 100000,
			hash: 'SHA-256'
		},
		keyMaterial,
		256
	);

	const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
	return `pbkdf2:${saltHex}:${hashHex}`;
}

/**
 * Verifies a password against a stored PBKDF2 hash.
 * 
 * @param {string} password
 * @param {string} storedHash Format: "pbkdf2:salt_hex:hash_hex"
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash) {
	if (!storedHash || typeof storedHash !== 'string' || !storedHash.startsWith('pbkdf2:')) {
		return false;
	}

	const parts = storedHash.split(':');
	if (parts.length !== 3) return false;

	const saltHex = parts[1];
	const expectedHashHex = parts[2];

	const saltMatch = saltHex.match(/.{1,2}/g);
	if (!saltMatch) return false;
	const salt = new Uint8Array(saltMatch.map(byte => parseInt(byte, 16)));

	try {
		const keyMaterial = await crypto.subtle.importKey(
			'raw',
			new TextEncoder().encode(password),
			{ name: 'PBKDF2' },
			false,
			['deriveBits']
		);

		const derivedBits = await crypto.subtle.deriveBits(
			{
				name: 'PBKDF2',
				salt,
				iterations: 100000,
				hash: 'SHA-256'
			},
			keyMaterial,
			256
		);

		const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
		return hashHex === expectedHashHex;
	} catch (err) {
		console.error('Password verification error:', err);
		return false;
	}
}

/**
 * Generates a human-friendly random password (alphanumeric, no confusing chars like 0/O, 1/l)
 * @param {number} length
 * @returns {string}
 */
export function generateRandomPassword(length = 8) {
	const chars = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
	const randomValues = crypto.getRandomValues(new Uint8Array(length));
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars[randomValues[i] % chars.length];
	}
	return result;
}
