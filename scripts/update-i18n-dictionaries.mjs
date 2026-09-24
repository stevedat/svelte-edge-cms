import fs from 'fs';
import path from 'path';

const viPath = path.resolve('src/lib/i18n/translations/vi.ts');
const enPath = path.resolve('src/lib/i18n/translations/en.ts');

let vi = fs.readFileSync(viPath, 'utf8');
let en = fs.readFileSync(enPath, 'utf8');

// 1. Projects already updated

// 2. Update consulting in vi.ts and en.ts
const viConsultingAnchor = "faq3A: 'Mọi thông tin trao đổi, ý tưởng và dữ liệu dự án của bạn đều được cam kết bảo mật tuyệt đối 100% theo thỏa thuận NDA.'";
const viConsultingAdditions = `faq3A: 'Mọi thông tin trao đổi, ý tưởng và dữ liệu dự án của bạn đều được cam kết bảo mật tuyệt đối 100% theo thỏa thuận NDA.',
		statsSessions: 'Giờ tư vấn & đào tạo',
		statsServerCost: 'Chi phí hạ tầng máy chủ',
		statsPrivacy: 'Bảo mật thông tin',
		coreStrengths: 'Năng lực cốt lõi',
		offerings: 'Hình thức hợp tác',
		auditBadge: 'Thẩm định 1:1',
		auditBtn: 'Đăng ký buổi thẩm định',
		popularBadge: 'Toàn diện nhất',
		comprehensiveBadge: 'Đồng hành trọn gói',
		comprehensiveBtn: 'Đăng ký cố vấn toàn diện',
		corporateBadge: 'Đào tạo nội bộ',
		workshopBtn: 'Liên hệ lịch Workshop',
		getInTouch: 'Đăng ký trực tiếp',
		sla24h: 'Phản hồi trong vòng 24 giờ làm việc',
		directExpert: 'Tư vấn trực tiếp từ Chuyên gia trưởng',
		readyHeading: 'Sẵn sàng tối ưu dự án của bạn?',
		readyDesc: 'Đăng ký tư vấn ngay để trao đổi chi tiết về yêu cầu của bạn.',
		trackRecord: 'Dự án & Năng lực thực tế'`;

const enConsultingAnchor = "faq3A: 'All discussions, codebases, ideas, and materials are kept strictly confidential under mutual NDA standards.'";
const enConsultingAdditions = `faq3A: 'All discussions, codebases, ideas, and materials are kept strictly confidential under mutual NDA standards.',
		statsSessions: 'Sessions Advised',
		statsServerCost: 'Cloud Server Cost',
		statsPrivacy: 'NDA & Privacy',
		coreStrengths: 'Core Strengths',
		offerings: 'Offerings',
		auditBadge: 'Quick Audit',
		auditBtn: 'Book Audit Session',
		popularBadge: 'Most Popular',
		comprehensiveBadge: 'End-to-End',
		comprehensiveBtn: 'Request Consultation',
		corporateBadge: 'Corporate',
		workshopBtn: 'Inquire Workshop',
		getInTouch: 'Get In Touch',
		sla24h: 'Response within 24 business hours',
		directExpert: 'Direct consultation with Lead Architect',
		readyHeading: 'Ready to accelerate your project?',
		readyDesc: 'Book a session now to discuss your requirements in detail.',
		trackRecord: 'Track Record'`;

if (!vi.includes('statsSessions:')) {
	vi = vi.replace(viConsultingAnchor, viConsultingAdditions);
	en = en.replace(enConsultingAnchor, enConsultingAdditions);
}

// 3. Update bento in vi.ts and en.ts
const viBentoAnchor = "contactBtn: 'Kết nối hợp tác'";
const viBentoAdditions = `contactBtn: 'Kết nối hợp tác',
		heroSubtitle: 'Kiến tạo Hệ thống & Trải nghiệm Số',
		flagshipBadge: 'Dự án tiêu biểu',
		coreMetrics: 'Chỉ số cốt lõi',
		performanceEdge: 'Hiệu suất & Uy tín',
		claimSlot: 'Nhận suất tài trợ $0',
		tooling: 'Công cụ',
		toolingDesc: 'Hệ sinh thái tinh gọn, tập trung vào hiệu năng thực tế, tính độc lập và bảo mật.',
		slotRemaining: 'Số lượng có hạn',
		slotTime: 'Có hạn',
		moreWorks: 'Dự án khác'`;

const enBentoAnchor = "contactBtn: 'Let\\'s Connect'";
const enBentoAdditions = `contactBtn: 'Let\\'s Connect',
		heroSubtitle: 'Crafting Digital Products & Systems',
		flagshipBadge: 'Flagship Showcase',
		coreMetrics: 'Core Metrics',
		performanceEdge: 'Performance at Edge',
		claimSlot: 'Claim VIP Slot ($0)',
		tooling: 'Tooling',
		toolingDesc: 'Modern native technologies built for speed, privacy, and zero maintenance.',
		slotRemaining: 'Limited slots',
		slotTime: 'Limited Time',
		moreWorks: 'More Works'`;

if (!vi.includes('heroSubtitle:')) {
	vi = vi.replace(viBentoAnchor, viBentoAdditions);
	en = en.replace(enBentoAnchor, enBentoAdditions);
}

// 4. Add errors & admin namespaces before final "};"
const viTail = `	errors: {
		notFoundTitle: 'Không tìm thấy trang',
		notFoundHeading: 'Trang không tồn tại',
		genericHeading: 'Đã có lỗi xảy ra',
		notFoundDesc: 'Đường dẫn bạn truy cập có thể đã được thay đổi, di chuyển hoặc không còn tồn tại.',
		genericDesc: 'Hệ thống gặp sự cố trong quá trình xử lý yêu cầu. Vui lòng thử lại sau.',
		homeBtn: 'Về Trang chủ',
		blogBtn: 'Khám phá Blog',
		backBtn: 'Quay lại'
	},
	admin: {
		nav: {
			dashboard: 'Tổng quan',
			posts: 'Bài viết',
			projects: 'Dự án',
			videos: 'Video',
			comments: 'Bình luận',
			leads: 'Khách hàng (Leads)',
			tenants: 'Quản lý Tenants',
			settings: 'Cấu hình Website',
			viewSite: 'Xem trang web',
			switchTenant: 'Đổi Tenant',
			logout: 'Đăng xuất',
			switchLang: 'Language / Ngôn ngữ'
		},
		dashboard: {
			title: 'Bảng điều khiển',
			welcome: 'Xin chào, {name}!',
			overviewSubtitle: 'Tổng quan vận hành và các chỉ số cốt lõi của hệ thống.',
			statsTotalPosts: 'Tổng bài viết',
			statsPublished: 'Đã xuất bản',
			statsProjects: 'Dự án hiển thị',
			statsActiveProjects: 'Đang hoạt động',
			statsVideos: 'Video bài giảng',
			statsPendingComments: 'Bình luận chờ duyệt',
			statsLeads: 'Khách hàng tiềm năng',
			statsNewLeads: '{count} khách hàng mới',
			quickActions: 'Thao tác nhanh',
			newPost: 'Viết bài mới',
			newProject: 'Thêm dự án',
			newVideo: 'Thêm video',
			recentActivity: 'Hoạt động gần đây',
			noActivity: 'Chưa có hoạt động nào được ghi nhận.'
		},
		leads: {
			title: 'Quản lý Khách hàng (Leads)',
			subtitle: 'Danh sách khách hàng tiềm năng gửi yêu cầu đặt lịch & tư vấn.',
			exportCsv: 'Xuất CSV (Excel)',
			searchPlaceholder: 'Tìm theo tên, email, sđt...',
			allStatuses: 'Tất cả trạng thái',
			statusNew: 'Mới tiếp nhận',
			statusContacted: 'Đang liên hệ',
			statusConfirmed: 'Đã chốt',
			statusCancelled: 'Đã hủy',
			colCustomer: 'Khách hàng',
			colContact: 'Liên hệ',
			colGoal: 'Mục tiêu / Ghi chú',
			colStatus: 'Trạng thái',
			colTime: 'Thời gian',
			colActions: 'Thao tác',
			call: 'Gọi',
			zalo: 'Zalo',
			copied: 'Đã sao chép SĐT',
			editNote: 'Ghi chú nội bộ',
			saveNote: 'Lưu ghi chú',
			saving: 'Đang lưu...',
			deleteConfirm: 'Bạn có chắc muốn xóa lead này không?',
			emptyTitle: 'Chưa có khách hàng tiềm năng nào',
			emptyDesc: 'Khi khách vãng lai điền form tư vấn, thông tin sẽ xuất hiện ngay tại đây.',
			totalLeads: 'Tổng số Leads'
		},
		settings: {
			title: 'Cấu hình Website',
			subtitle: 'Tùy chỉnh thương hiệu cá nhân, thông tin liên hệ và giao diện website.',
			saveBtn: 'Lưu thay đổi',
			savingBtn: 'Đang lưu...',
			saveSuccess: 'Cấu hình đã được lưu thành công!',
			tabGeneral: 'Thông tin chung',
			tabContact: 'Liên hệ & Mạng xã hội',
			tabFeatures: 'Phân hệ & Hiển thị',
			tabTheme: 'Giao diện & Bố cục',
			siteName: 'Tên Website / Tác giả',
			siteTitle: 'Tiêu đề trang (SEO)',
			siteBio: 'Mô tả ngắn (Bio)',
			heroTitle: 'Tiêu đề Hero (Tiếng Việt)',
			heroTitleEn: 'Tiêu đề Hero (Tiếng Anh)',
			heroBio: 'Mô tả Hero (Tiếng Việt)',
			heroBioEn: 'Mô tả Hero (Tiếng Anh)',
			contactEmail: 'Email liên hệ',
			contactPhone: 'Số điện thoại / Hotline',
			contactUrl: 'Đường dẫn liên hệ riêng (URL)',
			githubUrl: 'GitHub Profile',
			linkedinUrl: 'LinkedIn Profile',
			facebookUrl: 'Facebook Profile',
			youtubeUrl: 'Kênh YouTube',
			themePreset: 'Phong cách Giao diện (Theme Preset)',
			homeLayout: 'Bố cục Trang chủ (Layout)',
			showBlog: 'Hiển thị Phân hệ Blog (Bài viết)',
			showProjects: 'Hiển thị Phân hệ Projects (Dự án)',
			showVideos: 'Hiển thị Phân hệ Videos (Bài giảng)',
			showComments: 'Cho phép người đọc bình luận bài viết'
		},
		common: {
			actions: 'Hành động',
			edit: 'Chỉnh sửa',
			delete: 'Xóa',
			create: 'Tạo mới',
			back: 'Quay lại',
			cancel: 'Hủy bỏ',
			confirm: 'Xác nhận',
			search: 'Tìm kiếm...',
			filter: 'Bộ lọc',
			status: 'Trạng thái',
			createdAt: 'Ngày tạo',
			updatedAt: 'Cập nhật',
			loading: 'Đang tải...',
			noData: 'Không có dữ liệu.'
		}
	}
};`;

const enTail = `	errors: {
		notFoundTitle: 'Page Not Found',
		notFoundHeading: 'Page Not Found',
		genericHeading: 'An Error Occurred',
		notFoundDesc: 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.',
		genericDesc: 'The system encountered an error while processing your request. Please try again later.',
		homeBtn: 'Back to Home',
		blogBtn: 'Explore Blog',
		backBtn: 'Go Back'
	},
	admin: {
		nav: {
			dashboard: 'Dashboard',
			posts: 'Posts',
			projects: 'Projects',
			videos: 'Videos',
			comments: 'Comments',
			leads: 'Leads (CRM)',
			tenants: 'Manage Tenants',
			settings: 'Website Settings',
			viewSite: 'View Site',
			switchTenant: 'Switch Tenant',
			logout: 'Log Out',
			switchLang: 'Ngôn ngữ / Language'
		},
		dashboard: {
			title: 'Dashboard',
			welcome: 'Welcome, {name}!',
			overviewSubtitle: 'Operations overview and core performance metrics of your ecosystem.',
			statsTotalPosts: 'Total Posts',
			statsPublished: 'Published',
			statsProjects: 'Featured Projects',
			statsActiveProjects: 'Active',
			statsVideos: 'Video Lessons',
			statsPendingComments: 'Pending Comments',
			statsLeads: 'Customer Leads',
			statsNewLeads: '{count} new leads',
			quickActions: 'Quick Actions',
			newPost: 'New Post',
			newProject: 'New Project',
			newVideo: 'New Video',
			recentActivity: 'Recent Activity',
			noActivity: 'No recent activities recorded yet.'
		},
		leads: {
			title: 'Leads & Customer CRM',
			subtitle: 'Prospects requesting consultation sessions or advisory bookings.',
			exportCsv: 'Export CSV (Excel)',
			searchPlaceholder: 'Search name, email, phone...',
			allStatuses: 'All Statuses',
			statusNew: 'New Lead',
			statusContacted: 'Contacted',
			statusConfirmed: 'Confirmed',
			statusCancelled: 'Cancelled',
			colCustomer: 'Customer',
			colContact: 'Contact',
			colGoal: 'Goal / Note',
			colStatus: 'Status',
			colTime: 'Time',
			colActions: 'Actions',
			call: 'Call',
			zalo: 'Zalo',
			copied: 'Phone copied',
			editNote: 'Internal Note',
			saveNote: 'Save Note',
			saving: 'Saving...',
			deleteConfirm: 'Are you sure you want to delete this lead?',
			emptyTitle: 'No leads collected yet',
			emptyDesc: 'When visitors submit consultation or booking inquiries, they will appear here in real-time.',
			totalLeads: 'Total Leads'
		},
		settings: {
			title: 'Website Settings',
			subtitle: 'Customize your personal branding, contact channels, and layout configuration.',
			saveBtn: 'Save Changes',
			savingBtn: 'Saving...',
			saveSuccess: 'Settings saved successfully!',
			tabGeneral: 'General Info',
			tabContact: 'Contact & Socials',
			tabFeatures: 'Modules & Visibility',
			tabTheme: 'Theme & Layout',
			siteName: 'Site / Author Name',
			siteTitle: 'Site Title (SEO)',
			siteBio: 'Short Bio',
			heroTitle: 'Hero Title (Vietnamese)',
			heroTitleEn: 'Hero Title (English)',
			heroBio: 'Hero Bio (Vietnamese)',
			heroBioEn: 'Hero Bio (English)',
			contactEmail: 'Contact Email',
			contactPhone: 'Phone / Hotline',
			contactUrl: 'Direct Contact Link (URL)',
			githubUrl: 'GitHub Profile',
			linkedinUrl: 'LinkedIn Profile',
			facebookUrl: 'Facebook Profile',
			youtubeUrl: 'YouTube Channel',
			themePreset: 'Theme Preset',
			homeLayout: 'Homepage Layout',
			showBlog: 'Enable Blog Module',
			showProjects: 'Enable Projects Module',
			showVideos: 'Enable Videos Module',
			showComments: 'Enable Reader Comments'
		},
		common: {
			actions: 'Actions',
			edit: 'Edit',
			delete: 'Delete',
			create: 'Create',
			back: 'Back',
			cancel: 'Cancel',
			confirm: 'Confirm',
			search: 'Search...',
			filter: 'Filter',
			status: 'Status',
			createdAt: 'Created At',
			updatedAt: 'Updated At',
			loading: 'Loading...',
			noData: 'No data available.'
		}
	}
};`;

if (!vi.includes('admin: {')) {
	vi = vi.replace(/\n\};\s*$/, ',\n' + viTail);
	en = en.replace(/\n\};\s*$/, ',\n' + enTail);
}

fs.writeFileSync(viPath, vi, 'utf8');
fs.writeFileSync(enPath, en, 'utf8');

console.log('Successfully updated vi.ts and en.ts!');
