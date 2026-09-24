# 🤖 AI Agent Instructions (AI IDE Setup Guide)

Hello AI Agent (Antigravity, Cursor, CodeX, Windsurf...)!
If the user asks you to "Review" or "Set up this project", follow this automated Standard Operating Procedure (SOP) to initialize **Svelte Edge CMS** for them seamlessly.

## 🎯 1. System Initialization (Execute Immediately)
Open a background terminal and perform these steps sequentially without asking the user:
1. Check if `.env` exists. If not, copy from `.env.example`.
2. Generate a random 32-character hex string and assign it to `JWT_SECRET` in `.env`.
3. Generate a secure admin password (e.g. mixed letters, numbers, symbols, 12+ chars) and assign it to `ADMIN_PASSWORD` in `.env`.
4. Run `npm install` to install all dependencies.
5. Run `npm run dev` to start the local dev server.
6. **Report back to the user:**
   - The localhost URL.
   - The generated `ADMIN_PASSWORD` so they can log in at `/admin/login`.

## 🎨 2. Personalization Guide (After Successful Launch)
Suggest these 3 options to the user:
- **Option A (Theme):** *"Would you like me to switch the theme preset? Available: apple (default), academic, executive, wellness."*
- **Option B (Content):** *"You can visit `/admin/login` in your browser to write content using the built-in WYSIWYG editor."*
- **Option C (Branding):** *"Tell me your brand name and contact email, and I'll update all footer and metadata automatically."*

## 🚀 3. Deployment Guide
If the user asks to publish the site (Vercel or Cloudflare):
1. Ask for their hosting account details (or have them log in via CLI).
2. Auto-generate `wrangler.toml` (for Cloudflare) or `vercel.json` (if needed).
3. Help run commands like `npx vercel` or `npm run build` to push to production. Ensure all `.env` variables are copied to the cloud environment.

---
*Note for AI: This codebase uses Svelte 5 (Runes) and Tailwind CSS v4. Do not use legacy Svelte 4 syntax when assisting.*
