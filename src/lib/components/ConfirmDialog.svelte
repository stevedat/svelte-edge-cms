<script lang="ts">
	import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-svelte';
	import { t } from '$lib/i18n/index.js';

	interface Props {
		open?: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		danger?: boolean;
		loading?: boolean;
		onconfirm?: () => void;
		oncancel?: () => void;
	}

	let {
		open = $bindable(false),
		title = '',
		message = '',
		confirmText = '',
		cancelText = '',
		danger = true,
		loading = false,
		onconfirm,
		oncancel
	}: Props = $props();

	function handleClose() {
		if (loading) return;
		open = false;
		if (oncancel) oncancel();
	}

	function handleConfirm() {
		if (loading) return;
		if (onconfirm) onconfirm();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open && !loading) {
			handleClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-dialog-title"
		class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
	>
		<!-- Light-dismiss backdrop -->
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 bg-overlay backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-pointer"
			onclick={handleClose}
			aria-hidden="true"
		></div>

		<!-- Dialog Main Panel (Bottom sheet on mobile, centered modal on desktop) -->
		<div
			class="relative w-full sm:max-w-md bg-surface border-t sm:border border-border-subtle rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 p-6 sm:p-7 space-y-5 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 pb-[env(safe-area-inset-bottom,1.5rem)]"
		>
			<!-- Mobile Drag Handle indicator -->
			<div class="sm:hidden pt-1 pb-2 flex justify-center -mt-2">
				<div class="w-12 h-1.5 rounded-full bg-border-subtle/80"></div>
			</div>

			<!-- Header with Icon and 44x44px Close Button -->
			<div class="flex items-start justify-between gap-4">
				<div class="flex items-center gap-3">
					<div
						class="size-11 rounded-2xl flex items-center justify-center shrink-0 {danger
							? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
							: 'bg-primary/10 text-primary'}"
					>
						{#if danger}
							<Trash2 size={22} strokeWidth={2} />
						{:else}
							<AlertTriangle size={22} strokeWidth={2} />
						{/if}
					</div>
					<div>
						<h3 id="confirm-dialog-title" class="text-lg font-bold text-text-main tracking-tight leading-tight">
							{title || (danger ? t('admin.dialog.deleteTitle') : t('admin.dialog.confirmTitle'))}
						</h3>
					</div>
				</div>

				<button
					type="button"
					onclick={handleClose}
					disabled={loading}
					class="min-w-[44px] min-h-[44px] -mr-2 -mt-2 rounded-full flex items-center justify-center text-text-muted hover:text-text-main hover:bg-soft-bg active:scale-95 transition-all cursor-pointer disabled:opacity-40"
					aria-label={t('common.close')}
				>
					<X size={18} strokeWidth={2} />
				</button>
			</div>

			<!-- Message Body -->
			<p class="text-xs sm:text-sm text-text-body leading-relaxed">
				{message || (danger ? t('admin.dialog.deleteWarning') : '')}
			</p>

			<!-- Action Buttons with Ergonomic >=44px Touch Targets -->
			<div class="flex items-center gap-3 pt-2">
				<button
					type="button"
					onclick={handleClose}
					disabled={loading}
					class="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-soft-bg hover:bg-surface border border-border-subtle text-text-main font-bold text-xs sm:text-sm transition-all active:scale-98 cursor-pointer disabled:opacity-50"
				>
					{cancelText || t('admin.common.cancel')}
				</button>
				<button
					type="button"
					onclick={handleConfirm}
					disabled={loading}
					class="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-98 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 {danger
						? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
						: 'bg-primary hover:bg-primary/90 text-white'}"
				>
					{#if loading}
						<Loader2 strokeWidth={1.75} size={16} class="animate-spin" />
						<span>{t('admin.common.loading')}</span>
					{:else}
						<span>{confirmText || (danger ? t('admin.common.delete') : t('admin.common.confirm'))}</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
