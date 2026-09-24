import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { saveGithubFile, isGitHubConfigured } from '$lib/services/github.server.js';
import { hashPassword, generateRandomPassword } from '$lib/services/password.js';
import fs from 'node:fs/promises';
import path from 'node:path';

export const load = async () => {
    /** @type {Array<any>} */
    const tenants = [];
    const contentDir = path.resolve(process.cwd(), 'src/content');

    try {
        const entries = await fs.readdir(contentDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const domain = entry.name;
                const tenantDir = path.join(contentDir, domain);

                let settings = /** @type {Record<string, any>} */ ({});
                let postsCount = 0;
                let projectsCount = 0;
                let videosCount = 0;
                let leadsCount = 0;

                try {
                    const settingsRaw = await fs.readFile(path.join(tenantDir, 'settings.json'), 'utf-8');
                    settings = JSON.parse(settingsRaw);
                } catch (_) {}

                try {
                    const postsRaw = await fs.readFile(path.join(tenantDir, 'posts.json'), 'utf-8');
                    const posts = JSON.parse(postsRaw);
                    postsCount = Array.isArray(posts) ? posts.length : 0;
                } catch (_) {}

                try {
                    const projectsRaw = await fs.readFile(path.join(tenantDir, 'projects.json'), 'utf-8');
                    const projects = JSON.parse(projectsRaw);
                    projectsCount = Array.isArray(projects) ? projects.length : 0;
                } catch (_) {}

                try {
                    const videosRaw = await fs.readFile(path.join(tenantDir, 'videos.json'), 'utf-8');
                    const videos = JSON.parse(videosRaw);
                    videosCount = Array.isArray(videos) ? videos.length : 0;
                } catch (_) {}

                try {
                    const leadsRaw = await fs.readFile(path.join(tenantDir, 'leads.json'), 'utf-8');
                    const leads = JSON.parse(leadsRaw);
                    leadsCount = Array.isArray(leads) ? leads.length : 0;
                } catch (_) {}

                tenants.push({
                    domain,
                    siteName: settings.siteName || domain,
                    siteTitle: settings.siteTitle || '',
                    themePreset: settings.themePreset || 'apple',
                    homeLayout: settings.homeLayout || 'editorial',
                    showBlog: settings.showBlog !== false,
                    showProjects: settings.showProjects !== false,
                    showVideos: settings.showVideos !== false,
                    postsCount,
                    projectsCount,
                    videosCount,
                    leadsCount,
                    hasCustomPassword: !!settings.adminPasswordHash,
                    isDefault: domain === 'default'
                });
            }
        }
    } catch (err) {
        console.warn('[Tenants] Cannot read tenant directory list:', err);
    }

    // Sort default first, then alphabetically
    tenants.sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return a.domain.localeCompare(b.domain);
    });

    return { tenants };
};

export const actions = {
    createTenant: async ({ request }) => {
        const form = await request.formData();
        const rawDomain = form.get('domain')?.toString() || '';
        
        // Clean and normalize domain name
        const domain = rawDomain
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/\/.*$/, '')
            .replace(/[^a-z0-9.-]/g, '');

        if (!domain || domain.length < 3) {
            return fail(400, { message: 'Please enter a valid domain name (minimum 3 characters, e.g. my-tenant.com)' });
        }

        const tenantDir = path.resolve(process.cwd(), `src/content/${domain}`);

        // Check if tenant directory already exists
        try {
            const stat = await fs.stat(tenantDir);
            if (stat.isDirectory()) {
                return fail(400, { message: `Tenant "${domain}" already exists on the system!` });
            }
        } catch (_) {
            // Not exist, proceed
        }

        const rawTheme = form.get('themePreset')?.toString() || 'apple';
        const rawLayout = form.get('homeLayout')?.toString() || 'editorial';
        const rawSiteTitle = form.get('siteTitle')?.toString() || '';

        const themePreset = ['apple', 'academic', 'executive', 'wellness'].includes(rawTheme) ? rawTheme : 'apple';
        const homeLayout = ['editorial', 'one_page_consulting', 'bento_portfolio'].includes(rawLayout) ? rawLayout : 'editorial';
        const siteTitle = rawSiteTitle.trim() || `${domain} · Home`;

        const showBlog = form.has('showBlog') ? (form.get('showBlog') === 'true' || form.get('showBlog') === 'on') : true;
        const showVideos = form.has('showVideos') ? (form.get('showVideos') === 'true' || form.get('showVideos') === 'on') : true;
        const showProjects = form.has('showProjects') ? (form.get('showProjects') === 'true' || form.get('showProjects') === 'on') : true;

        // Custom or generated initial password
        const rawPassword = form.get('adminPassword')?.toString() || '';
        const plainPassword = rawPassword.trim() || generateRandomPassword(10);
        const passwordHash = await hashPassword(plainPassword);

        const defaultFiles = {
            'settings.json': JSON.stringify({
                siteName: domain,
                siteTitle,
                siteDescription: `Welcome to the official site of ${domain}.`,
                heroTitle: `Digital space of ${domain}`,
                heroBio: `Welcome to the independent website running on the multi-user Edge CMS platform.`,
                themePreset,
                homeLayout,
                showBlog,
                showVideos,
                showProjects,
                footerCopyright: domain,
                adminPasswordHash: passwordHash
            }, null, 2),
            'posts.json': JSON.stringify([
                {
                    id: `post_${Date.now()}`,
                    title: `Welcome to ${domain}!`,
                    slug: 'welcome-to-new-website',
                    excerpt: `The opening article on the independent digital space of ${domain}.`,
                    content: `## Welcome to ${domain}\n\nThis is a sample article automatically generated when creating a new tenant. You can log in to the admin panel to edit content, create new articles, update projects and customize brand colors.`,
                    status: 'PUBLISHED',
                    authorId: 'admin',
                    categoryId: 'general',
                    categorySlug: 'general',
                    publishedAt: new Date().toISOString(),
                    tags: ['welcome'],
                    tagSlugs: ['welcome'],
                    viewCount: 1
                }
            ], null, 2),
            'projects.json': JSON.stringify([
                {
                    id: `proj_${Date.now()}`,
                    title: `Featured Project ${domain}`,
                    slug: 'featured-project-startup',
                    description: `Space introducing products and core competencies of ${domain}.`,
                    client: 'Partner Clients',
                    category: 'Technology',
                    tags: ['Web', 'Design', 'Edge CMS'],
                    status: 'COMPLETED',
                    featured: true,
                    createdAt: new Date().toISOString()
                }
            ], null, 2),
            'videos.json': JSON.stringify([], null, 2),
            'categories.json': JSON.stringify([
                { id: 'general', name: 'General', slug: 'general' }
            ], null, 2),
            'tags.json': JSON.stringify([
                { id: 'welcome', name: 'Welcome', slug: 'welcome' }
            ], null, 2),
            'leads.json': JSON.stringify([], null, 2)
        };

        try {
            // 1. Tạo thư mục và ghi các tệp vào disk cục bộ
            await fs.mkdir(tenantDir, { recursive: true });
            await fs.mkdir(path.join(tenantDir, 'comments'), { recursive: true });

            for (const [file, content] of Object.entries(defaultFiles)) {
                await fs.writeFile(path.join(tenantDir, file), content, 'utf-8');
            }

            // 2. Đồng bộ lên GitHub nếu có cấu hình token
            if (isGitHubConfigured) {
                try {
                    for (const [file, content] of Object.entries(defaultFiles)) {
                        await saveGithubFile(`src/content/${domain}/${file}`, content, `feat(tenant): initialize space ${domain} [skip ci]`);
                    }
                } catch (ghErr) {
                    console.warn('[Tenants] Save to GitHub warning:', ghErr);
                }
            }

            return { 
                success: true, 
                message: `Successfully initialized tenant "${domain}" with complete sample data!`, 
                newDomain: domain,
                initialPassword: plainPassword
            };
        } catch (error) {
            console.error('Error creating tenant:', error);
            // @ts-ignore
            return fail(500, { message: 'Error initializing tenant: ' + (error?.message || error) });
        }
    },

    resetPassword: async ({ request }) => {
        const form = await request.formData();
        const domain = form.get('domain')?.toString().trim();
        if (!domain) return fail(400, { message: 'Missing domain information to reset password' });

        const customPassword = form.get('newPassword')?.toString().trim();
        const newPlainPassword = customPassword || generateRandomPassword(10);
        const newHash = await hashPassword(newPlainPassword);

        const tenantDir = path.resolve(process.cwd(), `src/content/${domain}`);
        const settingsPath = path.join(tenantDir, 'settings.json');

        try {
            let settings = {};
            try {
                const raw = await fs.readFile(settingsPath, 'utf-8');
                settings = JSON.parse(raw);
            } catch (_) {}

            settings.adminPasswordHash = newHash;
            const updatedContent = JSON.stringify(settings, null, 2);

            await fs.writeFile(settingsPath, updatedContent, 'utf-8');

            if (isGitHubConfigured) {
                try {
                    await saveGithubFile(`src/content/${domain}/settings.json`, updatedContent, `chore(tenant): reset password for ${domain} [skip ci]`);
                } catch (ghErr) {
                    console.warn('[Tenants] Reset password GitHub warn:', ghErr);
                }
            }

            return {
                resetSuccess: true,
                resetDomain: domain,
                resetPassword: newPlainPassword,
                message: `Successfully reset password for tenant "${domain}"!`
            };
        } catch (error) {
            console.error('Error resetting tenant password:', error);
            // @ts-ignore
            return fail(500, { message: 'Cannot reset password: ' + (error?.message || error) });
        }
    }
};
