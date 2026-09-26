# Svelte Edge CMS ⚡
> The ultra-fast, minimalist, Edge-native documentation & CMS engine built with SvelteKit 2, Svelte 5 Runes, and Tailwind CSS v4.

[![Svelte 5](https://img.shields.io/badge/Svelte-5.x_Runes-ff3e00?logo=svelte&logoColor=white)](https://svelte.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudflare Workers](https://img.shields.io/badge/Edge-Cloudflare_/_Vercel-f38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)
[![CI](https://github.com/stevedat/svelte-edge-cms/actions/workflows/ci.yml/badge.svg)](https://github.com/stevedat/svelte-edge-cms/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

An open-source, lightweight alternative to Docusaurus and traditional Headless CMS. Svelte Edge CMS gives you the instant speed of compiled Svelte 5, the flexibility of Git-backed Markdown, and the convenience of a **built-in visual WYSIWYG Admin editor** running 100% serverless at the Edge.

---

## ✨ Why Svelte Edge CMS?

| Feature | **Docusaurus / Traditional SSG** | **Svelte Edge CMS** |
| :--- | :--- | :--- |
| **Engine** | React + Heavy Virtual DOM Hydration | **Svelte 5 Runes (Compiled, Zero-VDOM)** |
| **Lighthouse Score** | 70 - 90 (JS hydration penalty) | **Instant 100/100 Core Web Vitals** |
| **Content Authoring** | Code-only (Requires Git, VS Code) | **Hybrid: Git Markdown + Visual WYSIWYG Admin** |
| **Multi-Tenancy** | 1 Site = 1 Repository & Deploy | **Built-in Edge Multi-tenant Domain Routing** |
| **Design System** | Basic CSS / Infima framework | **Apple Minimalist, OLED Dark Mode, 4 Theme Presets** |
| **Hosting Cost** | Traditional Node.js or Static CDN | **100% Serverless Edge (Free Tier Friendly)** |

---

## 🎯 Bạn có thể xây dựng gì với Svelte Edge CMS? (Use Cases)

Dự án này được thiết kế theo dạng **"All-in-one Starter"**, sẵn sàng triển khai ngay lập tức cho các mục đích:

* 📚 **Trang Tài liệu Kỹ thuật & API Docs (Thay thế Docusaurus, GitBook)**:
  Tốc độ tải tức thì (100/100 Core Web Vitals), phân cấp chuyên mục rõ ràng, hỗ trợ khối mã nguồn highlight cú pháp và Dark Mode OLED.

* ✍️ **Blog Kỹ thuật & Tạp chí Tri thức (Thay thế Ghost, WordPress)**:
  Soạn thảo trực quan với trình biên tập WYSIWYG (Tiptap) hoặc Markdown, tính thời gian đọc, bộ lọc tag, chống spam PoW và quản lý bài viết độc lập.

* 💼 **Portfolio Cá Nhân & Trưng bày Sản phẩm (Apple Minimalist Portfolio)**:
  Giao diện Bento thời thượng hoặc Classic Editorial để trưng bày dự án, phần mềm số, ứng dụng di động và case studies với phong cách thẩm mỹ tối giản chuẩn Apple.

* 🤝 **Trang Tư vấn, Đặt lịch & Thu thập Khách hàng (Consulting & Lead Gen)**:
  Bố cục trang đích chuyển đổi cao, bảng giá 3 gói dịch vụ, form đặt lịch tư vấn và hệ thống mini CRM quản lý danh sách khách hàng tiềm năng (`/admin/leads`).

* 🌐 **Nền tảng Multi-tenant cho Freelancer & Agency**:
  Chạy cùng lúc hàng chục website độc lập với tên miền riêng biệt cho từng khách hàng trên cùng **một mã nguồn duy nhất**, chi phí vận hành $0 với Cloudflare / Vercel Edge.

---

## 🚀 Khởi tạo "AI-First" (Khuyên dùng)

Thay vì mở Terminal gõ lệnh thủ công, mã nguồn này được thiết kế để **AI Agent (như Antigravity, Cursor, CodeX, Windsurf) tự động làm thay bạn**.

**Quy trình 4 Bước siêu tốc:**
1. **Tải mã nguồn:** Nhấn nút `Code` -> `Download ZIP` hoặc Clone repo này về máy, rồi giải nén vào một thư mục.
2. **Cấp quyền cho AI:** Mở thư mục vừa giải nén bằng AI IDE của bạn và cấp cho IDE toàn quyền truy cập File & Terminal.
3. **Thần chú Khởi tạo:** Mở khung chat của AI và gõ đúng dòng lệnh sau: 
   > **`Review AGENT_INSTRUCTIONS.md và thiết lập dự án này cho tôi.`**
4. **Tận hưởng:** AI sẽ tự động hiểu kiến trúc, tạo file `.env`, sinh mật khẩu bảo mật, cài đặt thư viện (`npm install`), và bật server (`npm run dev`).

Sau khi kiểm tra trang web tại `http://localhost:5173`, nếu bạn muốn đưa website lên mạng (Online), bạn chỉ việc chat tiếp với AI: 
> *"Hãy hướng dẫn và dùng CLI giúp tôi deploy thư mục này lên Vercel (hoặc Cloudflare) miễn phí."*

---

## 🔐 Admin Dashboard

Access the visual admin workspace at:
* **URL:** `http://localhost:5173/admin/login`
* **Password:** Set via `ADMIN_PASSWORD` in your `.env` file.

From the dashboard, you can:
- Write and publish articles using the rich Tiptap WYSIWYG editor.
- Showcase digital products and portfolios.
- Switch between 4 built-in Apple-inspired theme presets (**apple**, **academic**, **executive**, **wellness**).
- Manage bilingual localization (Vietnamese / English).

---

## ☁️ 1-Click Deployment

Deploy anywhere on the Edge for $0:

### Option A: Cloudflare Pages
```bash
npm run build
npx wrangler pages deploy .svelte-kit/cloudflare
```

### Option B: Vercel Edge
Push to GitHub and import your repository to Vercel with zero configuration required.

---

## 🎨 Theme Presets

Switch presets directly from `src/content/default/settings.json` or the Admin UI:
- **`apple`** *(Default)*: Slate titanium and OLED true black minimalism.
- **`academic`**: Warm cream paper texture tailored for long-form essays and documentation.
- **`executive`**: Deep royal navy and champagne gold accents for corporate authority.
- **`wellness`**: Crisp medical teal and soothing mint for healthcare & coaching.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.
