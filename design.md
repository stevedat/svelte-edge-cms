# Design System: Edge CMS

Tài liệu này định nghĩa các tiêu chuẩn về giao diện (UI) và trải nghiệm (UX) trên toàn hệ thống Edge CMS, đảm bảo sự đồng bộ, xuyên suốt và đẳng cấp mang phong cách Apple (Apple-esque).

## 1. Triết lý Thiết kế (Design Philosophy)
- **Tối giản (Minimalism)**: Loại bỏ các chi tiết thừa, focus vào nội dung.
- **Tương phản (High Contrast)**: Chữ phải dễ đọc trên mọi nền (Đạt chuẩn accessibility).
- **Mượt mà (Fluidity)**: Các thao tác chuyển trang, hover, click, thay đổi Theme phải có Transition không độ trễ hoặc giật lag.

## 2. Màu sắc (Colors)
Sử dụng Tailwind CSS utility classes.

### Light Mode (Mặc định)
- **Nền chính (Background)**: `bg-slate-50` hoặc `bg-white` (Tuỳ vào độ sâu component). Off-white `#f5f5f7` cho tổng thể.
- **Văn bản (Text)**: `text-slate-900` cho Tiêu đề (Headings), `text-slate-600` cho văn bản phụ (Body/Descriptions).
- **Viền (Border)**: `border-slate-100` hoặc `border-slate-200`. Rất mảnh và tinh tế.
- **Màu nhấn (Primary/Accent)**: `text-indigo-600`, `bg-indigo-600`.

### Dark Mode (Apple Style)
Phải cực kỳ sâu và không chói.
- **Nền chính (Background)**: `dark:bg-black` cho nền tổng, `dark:bg-zinc-900` hoặc `dark:bg-slate-900` cho các thẻ (Cards), Modals. Không dùng nền xám sáng gây cảm giác chìm.
- **Văn bản (Text)**: `dark:text-white` cho Tiêu đề, `dark:text-slate-300` hoặc `dark:text-slate-400` cho văn bản phụ.
- **Viền (Border)**: `dark:border-white/10` (trắng trong suốt) hoặc `dark:border-slate-800`. Tuyệt đối không để viền bị sáng quá gây chói.
- **Shadow**: Bỏ box-shadow đậm ở dark mode. Sử dụng viền mảnh `dark:border-white/10` để tạo chiều sâu thay cho bóng đổ.

## 3. Typography & Components
- **Font**: Inter hoặc San Francisco (mặc định của Apple `system-ui`).
- **Bo góc (Border Radius)**: 
  - Cards, Modals lớn: `rounded-[2rem]` hoặc `rounded-3xl`
  - Nút bấm, Inputs: `rounded-xl` hoặc `rounded-2xl`
- **Nút bấm (Buttons)**:
  - Cần có trạng thái `hover`, `active`, và `disabled`.
  - Ví dụ: `bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:opacity-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5`.
- **Forms & Inputs**:
  - Viền mỏng, có focus ring.
  - Ví dụ: `border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`.

## 4. Chuyển đổi Theme (Theme Transition)
- Yêu cầu cấu hình global transition cho background và text color.
- Gắn class `.theme-transition { transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease; }` vào thẻ `<body>`.
- Các elements có hover background cũng phải có `transition-colors`.

## 5. Quy tắc Code Tailwind
- Tránh việc đặt các màu trực tiếp lộn xộn (ví dụ: `bg-[#123123]`). Ưu tiên dải màu có sẵn của Tailwind (`slate`, `indigo`, `rose`...)
- Luôn viết cặp class sáng/tối đi liền nhau: `bg-white dark:bg-slate-900`, `text-slate-900 dark:text-white`.
