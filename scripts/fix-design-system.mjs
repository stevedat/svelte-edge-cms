import fs from 'node:fs/promises';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'src');

async function getSvelteFiles(dir) {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await getSvelteFiles(fullPath)));
		} else if (entry.isFile() && entry.name.endsWith('.svelte')) {
			files.push(fullPath);
		}
	}
	return files;
}

async function fixFile(filePath) {
	let content = await fs.readFile(filePath, 'utf-8');
	let modified = false;

	// 1. Fix missing strokeWidth on Lucide icons
	const lucideImportMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-svelte['"]/);
	if (lucideImportMatch) {
		const lucideIcons = lucideImportMatch[1]
			.split(',')
			.map(s => s.trim().split(/\s+as\s+/)[0].trim())
			.filter(s => s && /^[A-Z]/.test(s));
		
		for (const icon of lucideIcons) {
			const tagRegex = new RegExp(`<${icon}\\b([^>]*)\\/?>`, 'g');
			content = content.replace(tagRegex, (match, attrs) => {
				if (!attrs.includes('strokeWidth') && !attrs.includes('stroke-width')) {
					modified = true;
					const defaultStroke = icon === 'Check' ? 'strokeWidth={2.25}' : 'strokeWidth={1.75}';
					if (match.endsWith('/>')) {
						return `<${icon} ${defaultStroke}${attrs}/>`;
					} else {
						return `<${icon} ${defaultStroke}${attrs}>`;
					}
				}
				return match;
			});
		}
	}

	// 2. Fix hardcoded colors using precise regexes
	const colorReplacements = [
		{ regex: /\bbg-black\/60\b/g, replacement: 'bg-overlay' },
		{ regex: /\bbg-black\/50\b/g, replacement: 'bg-overlay' },
		{ regex: /\bbg-white(?![/\w-])/g, replacement: 'bg-surface' }, // Defaulting white backgrounds to surface
		{ regex: /\bbg-black(?![/\w-])/g, replacement: 'bg-main-bg' }, // Defaulting black to main-bg
		{ regex: /\bbg-slate-(?:50|100|200)\b/g, replacement: 'bg-soft-bg' },
		{ regex: /\bbg-slate-(?:800|900)\b/g, replacement: 'bg-surface' },
		{ regex: /\bbg-gray-(?:50|100|200)\b/g, replacement: 'bg-soft-bg' },
		{ regex: /\bbg-gray-(?:800|900)\b/g, replacement: 'bg-surface' },
		{ regex: /\btext-slate-(?:400|500|600)\b/g, replacement: 'text-text-muted' },
		{ regex: /\btext-slate-(?:700|800|900)\b/g, replacement: 'text-text-main' },
		{ regex: /\btext-gray-(?:400|500|600)\b/g, replacement: 'text-text-muted' },
		{ regex: /\btext-gray-(?:700|800|900)\b/g, replacement: 'text-text-main' },
		{ regex: /\bborder-slate-(?:100|200|300)\b/g, replacement: 'border-border-subtle' },
		{ regex: /\bborder-slate-(?:700|800)\b/g, replacement: 'border-border-strong' },
		{ regex: /\bborder-gray-(?:100|200|300)\b/g, replacement: 'border-border-subtle' },
		{ regex: /\bborder-gray-(?:700|800)\b/g, replacement: 'border-border-strong' }
	];

	const isSettingsPaletteSwatch = filePath.includes('settings/+page.svelte');
	
	let lines = content.split('\n');
	for (let i = 0; i < lines.length; i++) {
		if (isSettingsPaletteSwatch && (lines[i].includes('style="background-color:') || lines[i].includes('title="Nền'))) {
			continue; // skip palette swatches
		}
		
		let lineModified = false;
		for (const { regex, replacement } of colorReplacements) {
			if (regex.test(lines[i])) {
				lines[i] = lines[i].replace(regex, replacement);
				lineModified = true;
			}
		}
		if (lineModified) modified = true;
	}
	
	if (modified) {
		await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
		console.log(`Fixed: ${path.relative(process.cwd(), filePath)}`);
	}
}

async function main() {
	console.log(`🚀 Bắt đầu tự động sửa lỗi quy chuẩn thiết kế...`);
	const files = await getSvelteFiles(SRC_DIR);
	for (const file of files) {
		await fixFile(file);
	}
	console.log(`✅ Đã hoàn tất sửa lỗi thiết kế.`);
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
