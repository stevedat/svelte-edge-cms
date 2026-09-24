<script lang="ts">
	import { isFreeSlotModalOpen, closeFreeSlotModal, freeSlotModalSource } from '$lib/state/freeSlot.js';
	import { 
		X, 
		Loader2, 
		Check,
		Gift,
		Sparkles
	} from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { getLocale, t } from '$lib/i18n/index.js';

	// Component Props
	let {
		isMaster = true
	}: {
		isMaster?: boolean;
	} = $props();

	// State
	let phone = $state('');
	let email = $state('');
	let name = $state('');
	let field = $state('');
	let note = $state('');
	
	let isSubmitting = $state(false);
	let isSuccess = $state(false);
	let submitError = $state('');
	let websiteTrap = $state(''); // Honeypot cho bot

	// Quick Select Options
	const quickFieldOptions = $derived([
		{ label: isMaster ? t('freeSlotModal.fieldOptEnglish') : (getLocale() === 'en' ? 'Education' : 'Giáo dục / Trường học') },
		{ label: isMaster ? t('freeSlotModal.fieldOptTech') : (getLocale() === 'en' ? 'Tech / SaaS' : 'Công nghệ / SaaS') },
		{ label: isMaster ? t('freeSlotModal.fieldOptOther') : (getLocale() === 'en' ? 'Other' : 'Khác') }
	]);

	function handleQuickSelectField(selectedLabel: string) {
		field = selectedLabel;
	}

	function handleClose() {
		closeFreeSlotModal();
		setTimeout(() => {
			if (isSuccess) {
				phone = '';
				email = '';
				name = '';
				field = '';
				note = '';
				isSuccess = false;
				submitError = '';
			}
		}, 300);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		if (websiteTrap) {
			console.log("Bot detected. Silently rejecting.");
			isSuccess = true;
			return;
		}

		if (!phone.trim()) {
			submitError = t('freeSlotModal.phoneRequired');
			return;
		}

		isSubmitting = true;
		submitError = '';

		try {
			const res = await fetch('/api/register-free-slot', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phone,
					email,
					name,
					field,
					note,
					source: $freeSlotModalSource
				})
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Failed to register');
			}

			isSuccess = true;
			
		} catch (err: any) {
			console.error("Free slot registration error:", err);
			submitError = err.message || t('freeSlotModal.submitErrorGeneral');
		} finally {
			isSubmitting = false;
		}
	}

	let modalTitle = $derived(
		isMaster 
			? ($freeSlotModalSource === 'projects_card' ? t('projects.claimSlotProjectBtn') : t('freeSlotModal.defaultTitle'))
			: (getLocale() === 'en' ? 'Contact Us' : 'Liên hệ với chúng tôi')
	);
	
	let modalSubtitle = $derived(
		isMaster 
			? t('freeSlotModal.defaultSubtitle') 
			: (getLocale() === 'en' ? 'Leave your information below, we will contact you soon.' : 'Để lại thông tin bên dưới, chúng tôi sẽ liên hệ lại sớm nhất.')
	);

	let submitBtnText = $derived(
		isMaster 
			? t('freeSlotModal.submitBtn')
			: (getLocale() === 'en' ? 'Send Request' : 'Gửi Yêu Cầu')
	);

	let successDesc = $derived(
		isMaster
			? t('freeSlotModal.successDesc')
			: (getLocale() === 'en' ? 'Your request has been sent successfully. We will get back to you shortly via the provided contact info.' : 'Yêu cầu của bạn đã được gửi thành công. Chúng tôi sẽ sớm phản hồi qua thông tin liên hệ cung cấp.')
	);
</script>

{#if $isFreeSlotModalOpen}
	<!-- Backdrop Blur Overlay -->
	<div 
		class="fixed inset-0 z-[100] backdrop-blur-md bg-main-bg/80 dark:bg-black/80 transition-all flex items-center justify-center p-4 sm:p-6"
		transition:fade={{ duration: 200 }}
	>
		<!-- Modal Card -->
		<div 
			class="w-full max-w-lg bg-surface border border-border-subtle rounded-3xl shadow-2xl shadow-black/10 dark:shadow-none overflow-hidden relative flex flex-col max-h-[90vh]"
			transition:fly={{ y: 20, duration: 300, opacity: 0 }}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<!-- Header -->
			<div class="px-6 py-6 border-b border-border-subtle flex items-start justify-between shrink-0 bg-surface z-10 sticky top-0">
				<div>
					<h3 id="modal-title" class="text-2xl font-serif text-text-main flex items-center gap-2">
						{#if isMaster}<Gift size={20} strokeWidth={1.75} class="text-text-main" />{/if}
						<span>{modalTitle}</span>
					</h3>
					<p class="text-sm text-text-muted mt-1.5 leading-relaxed">
						{modalSubtitle}
					</p>
				</div>
				<button 
					type="button" 
					onclick={handleClose}
					class="p-2 rounded-full hover:bg-soft-bg text-text-muted hover:text-text-main transition-colors shrink-0 -mt-1 -mr-2"
					aria-label={t('freeSlotModal.closeBtn')}
				>
					<X size={20} strokeWidth={1.75} />
				</button>
			</div>

			<!-- Body - Scrollable -->
			<div class="p-6 overflow-y-auto overscroll-contain">
				{#if !isSuccess}
					<form onsubmit={handleSubmit} class="space-y-6">
						
						{#if submitError}
							<div class="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm flex items-start gap-2 animate-in fade-in duration-200">
								<X size={16} strokeWidth={2.5} class="mt-0.5 shrink-0" />
								<span>{submitError}</span>
							</div>
						{/if}

						<!-- Honeypot -->
						<div class="hidden" aria-hidden="true">
							<input type="text" name="website_trap" bind:value={websiteTrap} tabindex="-1" autocomplete="off" />
						</div>

						<!-- Số điện thoại (Float Label) -->
						<div class="relative pt-4 group">
							<input
								id="reg-phone"
								type="tel"
								required
								placeholder=" "
								bind:value={phone}
								class="peer w-full px-0 py-2 bg-transparent border-0 border-b border-border-subtle focus:border-text-main focus:ring-0 text-text-main text-lg transition-colors placeholder:text-transparent"
							/>
							<label 
								for="reg-phone" 
								class="absolute left-0 top-6 text-text-muted text-lg transition-all peer-focus:text-xs peer-focus:top-0 peer-focus:text-text-main peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:top-0 cursor-text flex items-center gap-1"
							>
								{t('freeSlotModal.phoneLabel')} <span class="text-red-500 font-bold">*</span>
							</label>
						</div>

						<!-- Email (Float Label) -->
						<div class="relative pt-4 group">
							<input
								id="reg-email"
								type="email"
								placeholder=" "
								bind:value={email}
								class="peer w-full px-0 py-2 bg-transparent border-0 border-b border-border-subtle focus:border-text-main focus:ring-0 text-text-main text-lg transition-colors placeholder:text-transparent"
							/>
							<label 
								for="reg-email" 
								class="absolute left-0 top-6 text-text-muted text-lg transition-all peer-focus:text-xs peer-focus:top-0 peer-focus:text-text-main peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:top-0 cursor-text flex items-center gap-1"
							>
								{t('freeSlotModal.emailLabel')} 
							</label>
						</div>

						<!-- Họ và tên (Float Label) -->
						<div class="relative pt-4 group">
							<input
								id="reg-name"
								type="text"
								placeholder=" "
								bind:value={name}
								class="peer w-full px-0 py-2 bg-transparent border-0 border-b border-border-subtle focus:border-text-main focus:ring-0 text-text-main text-lg transition-colors placeholder:text-transparent"
							/>
							<label 
								for="reg-name" 
								class="absolute left-0 top-6 text-text-muted text-lg transition-all peer-focus:text-xs peer-focus:top-0 peer-focus:text-text-main peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:top-0 cursor-text flex items-center gap-1"
							>
								{t('freeSlotModal.nameLabel')}
							</label>
						</div>

						<!-- Lĩnh vực (Float Label with Chips) -->
						<div class="space-y-4 pt-4">
							<div class="relative group">
								<input
									id="reg-field"
									type="text"
									placeholder=" "
									bind:value={field}
									class="peer w-full px-0 py-2 bg-transparent border-0 border-b border-border-subtle focus:border-text-main focus:ring-0 text-text-main text-lg transition-colors placeholder:text-transparent"
								/>
								<label 
									for="reg-field" 
									class="absolute left-0 top-2 text-text-muted text-lg transition-all peer-focus:text-xs peer-focus:-top-4 peer-focus:text-text-main peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:-top-4 cursor-text flex items-center gap-1"
								>
									{isMaster ? t('freeSlotModal.fieldLabel') : (getLocale() === 'en' ? 'Organization / Field' : 'Đơn vị / Chuyên môn')}
								</label>
							</div>
							
							<!-- Quick-Select Chips -->
							<div class="flex flex-wrap gap-2">
								{#each quickFieldOptions as opt}
									<button
										type="button"
										onclick={() => handleQuickSelectField(opt.label)}
										class="px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border {field === opt.label ? 'bg-text-main text-main-bg border-text-main' : 'bg-transparent text-text-muted border-border-subtle hover:border-text-main hover:text-text-main'}"
									>
										{opt.label}
									</button>
								{/each}
							</div>
						</div>

						<!-- Ghi chú (Float Label Textarea) -->
						<div class="relative pt-4 group">
							<textarea
								id="reg-note"
								rows="2"
								placeholder=" "
								bind:value={note}
								class="peer w-full px-0 py-2 bg-transparent border-0 border-b border-border-subtle focus:border-text-main focus:ring-0 text-text-main text-lg transition-colors placeholder:text-transparent resize-none"
							></textarea>
							<label 
								for="reg-note" 
								class="absolute left-0 top-6 text-text-muted text-lg transition-all peer-focus:text-xs peer-focus:top-0 peer-focus:text-text-main peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:top-0 cursor-text flex items-center gap-1"
							>
								{isMaster ? t('freeSlotModal.noteLabel') : (getLocale() === 'en' ? 'Specific Request / Note' : 'Ghi chú / Nhu cầu cụ thể')}
							</label>
						</div>

						<!-- Submit Button -->
						<div class="pt-6">
							<button
								type="submit"
								disabled={isSubmitting}
								class="w-full py-4 px-6 rounded-full bg-text-main text-main-bg hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 font-medium text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/5 dark:shadow-none"
							>
								{#if isSubmitting}
									<Loader2 strokeWidth={1.75} size={18} class="animate-spin" />
									<span>{t('freeSlotModal.submittingBtn')}</span>
								{:else}
									<Sparkles size={18} strokeWidth={1.75} />
									<span>{submitBtnText}</span>
								{/if}
							</button>
						</div>

					</form>
				{:else}
					<!-- Success Screen -->
					<div class="py-12 text-center space-y-6 animate-in zoom-in duration-500">
						<div class="inline-flex items-center justify-center size-20 rounded-full border border-text-main text-text-main mx-auto mb-4">
							<Check size={40} strokeWidth={1.5} />
						</div>

						<div class="space-y-4 max-w-sm mx-auto">
							<h4 class="text-3xl font-serif text-text-main">
								{t('freeSlotModal.successTitle')}
							</h4>
							<p class="text-base text-text-muted leading-relaxed font-medium">
								{successDesc}
							</p>
						</div>

						<button
							type="button"
							onclick={handleClose}
							class="mt-8 px-8 py-3 rounded-full bg-soft-bg text-text-main text-sm font-medium hover:bg-text-main hover:text-main-bg transition-colors cursor-pointer border border-border-subtle"
						>
							{t('freeSlotModal.closeBtn')}
						</button>
					</div>
				{/if}
			</div>

		</div>
	</div>
{/if}
