---
name: mobile-ux-standards
description: Enforces mobile-first touch ergonomics, accessible modal/dialog patterns, >=44px close buttons, light-dismiss, and select-pick-up choose patterns across Svelte components.
license: Complete terms in LICENSE.txt
---

# Mobile UX & Modal/Dialog Standards

Quy chuẩn thiết kế và lập trình giao diện di động (Mobile-First UX) cho dự án, tập trung vào công thái học ngón tay cái, khả năng tiếp cận (a11y) và trải nghiệm hộp thoại (Modal/Dialog/Drawer).

---

## 1. Quy chuẩn Vùng Chạm (Touch Target Ergonomics)

Theo tiêu chuẩn **WCAG 2.5.5 / 2.5.8**, **Apple Human Interface Guidelines** và **Google Material Design 3**:

- **Vùng chạm tối thiểu**: Mọi phần tử tương tác (nút bấm, icon close, checkbox, tab, switch) trên di động **BẮT BUỘC** đạt kích thước tối thiểu **44x44px** (hoặc tối thiểu 38px cho các segmented button nhỏ nhưng phải có khoảng cách đệm an toàn).
- **Quy tắc Tailwind CSS**:
  ```html
  <!-- Khuyên dùng cho icon button: min-h-[44px] min-w-[44px] hoặc p-2.5 -->
  <button 
    type="button"
    class="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-2.5 hover:bg-soft-bg active:scale-95 transition-all cursor-pointer"
    aria-label="Đóng"
  >
    <X size={20} />
  </button>
  ```
- **Khoảng cách tối thiểu (Spacing)**: Giữa 2 phần tử tương tác cạnh nhau cần có ít nhất 8px khoảng trống để chống bấm nhầm (fat-finger prevention).

---

## 2. Quy chuẩn Hộp Thoại (Modal & Dialog Architecture)

### A. Mobile Bottom Sheet vs. Desktop Centered Dialog
- Trên màn hình di động (`< 640px` / `< sm`): Hộp thoại phải hiển thị dạng **Bottom Sheet** (bám đáy màn hình), có bo tròn đỉnh `rounded-t-3xl rounded-b-none`, đi kèm **thanh trượt vuốt (drag handle)** trực quan.
- Trên màn hình máy tính (`>= 640px` / `>= sm`): Tự động chuyển về dạng modal canh giữa màn hình `items-center justify-center p-6 rounded-3xl`.
- **Cấu trúc mẫu**:
  ```html
  <!-- Modal Overlay Container -->
  <div 
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
  >
    <!-- Backdrop với Light Dismiss -->
    <div 
      class="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
      onclick={handleClose}
      aria-hidden="true"
    ></div>

    <!-- Panel chính -->
    <div class="relative w-full sm:max-w-lg bg-surface border-t sm:border border-border-subtle rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] pb-[env(safe-area-inset-bottom,1rem)]">
      <!-- Mobile Drag Handle -->
      <div class="sm:hidden pt-3 pb-1 flex justify-center">
        <div class="w-12 h-1.5 rounded-full bg-border-subtle"></div>
      </div>
      ...
    </div>
  </div>
  ```

### B. Cơ Chế Đóng Linh Hoạt (Dismiss Mechanisms)
Bắt buộc hỗ trợ đủ 3 cách thoát:
1. **Light Dismiss**: Chạm vào vùng đen mờ phía ngoài (backdrop) để đóng.
2. **Platform Dismiss**: Bấm phím `Escape` trên bàn phím để đóng.
3. **Explicit Close**: Nút `✕` (Close Button) đặt ở góc trên phải, kích thước tối thiểu 44x44px.

---

## 3. Quy chuẩn Nút Đóng (Close Buttons)

- **Kích thước**: Luôn đạt tối thiểu `44x44px` (`min-w-[44px] min-h-[44px]` hoặc `size-11`).
- **Khả năng truy cập (a11y)**:
  - Bắt buộc có thuộc tính `aria-label="Đóng"` (hoặc `aria-label={t('common.close')}`).
  - Bắt buộc dùng thẻ `<button type="button">`, không dùng thẻ `div` hoặc `span` với click event.
- **Vị trí**:
  - Pinned tại góc trên cùng bên phải (`absolute top-3 right-3 sm:top-5 sm:right-5`).
  - Tiêu đề hoặc nội dung bên cạnh phải có khoảng đệm `pr-12` để tuyệt đối không bị đè chữ.

---

## 4. Quy chuẩn Bộ Chọn Nhanh (Select / Pick-Up Choose)

- **Vấn đề trên di động**: Nhập văn bản dài trên bàn phím ảo điện thoại tốn nhiều thao tác và dễ gây bỏ dở form. Dropdown `<select>` mặc định của hệ điều hành thường che mất ngữ cảnh.
- **Giải pháp Pick-Up Choose**:
  - Cung cấp các **Quick-Pick Chips (Thẻ chọn nhanh)** dạng hàng ngang hoặc lưới 2-3 cột.
  - Người dùng chỉ cần chạm 1 chạm để chọn giá trị phổ biến (Ví dụ: "Thiết kế Website", "Tư vấn", "Khác...").
  - Nếu chọn "Khác...", hệ thống tự động focus vào ô nhập text tự do để người dùng bổ sung chi tiết.
  - Vùng chạm của mỗi Chip phải có chiều cao tối thiểu 38-44px (`py-2 px-3 text-xs`).
  - Trạng thái đã chọn phải có độ tương phản cao rõ rệt (`bg-primary text-white font-bold`).

---

## 5. Quy chuẩn Cấm Dùng `window.confirm()`

- **Tuyệt đối không sử dụng `confirm()` mặc định của trình duyệt**: Gây đứng luồng JavaScript, không hỗ trợ giao diện tối (Dark Mode), không tương thích ngôn ngữ i18n chuẩn và trải nghiệm thô ráp trên di động.
- **Thay thế**: Sử dụng `ConfirmDialog.svelte` với thông điệp song ngữ rõ ràng, 2 nút "Hủy" và "Xác nhận" to rõ chuẩn ngón tay cái.
