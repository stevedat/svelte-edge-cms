---
name: i18n-manager
description: >-
  Audits, extracts, synchronizes, and validates bilingual (Vi/En) localization across the codebase.
  Use when checking i18n coverage, adding new translation keys to vi.ts and en.ts, eliminating
  hardcoded text in Svelte components, or ensuring 100% parity between Vietnamese and English dictionaries.
---

# i18n Manager Skill

A comprehensive operational guide and tooling suite for maintaining 100% bilingual (Vietnamese/English) coverage in the application.

## Core Rules & Principles

1. **Strict 1-1 Key Parity**:
   Every key in `src/lib/i18n/translations/vi.ts` MUST exist in `src/lib/i18n/translations/en.ts` with identical structure and placeholder parameters.
2. **Zero Hardcoded Strings**:
   No user-facing text, error message, toast, or modal copy should be hardcoded in `.svelte` or `.js` files.
3. **No Ad-hoc Ternaries in Templates**:
   Avoid `{getLocale() === 'en' ? '...' : '...'}`. Instead, create a key in `vi.ts` & `en.ts` and use `{t('namespace.key')}`.
4. **Dynamic Content Fallbacks**:
   For dynamic multi-tenant / database items (e.g. project title, biography), use the helper:
   ```svelte
   import { localized, localizedArray } from '$lib/i18n/index.js';
   <span>{localized(item, 'title')}</span>
   ```

---

## Tooling & Verification

### Run i18n Audit
Run the automated audit tool to inspect dictionary parity and discover all unlocalized strings:
```bash
npm run i18n:audit
```

To run in CI/Strict mode (fails if any untranslated string or missing key is detected):
```bash
npm run i18n:check
```

---

## How to Add New Translations

1. **Locate or create the appropriate namespace** in `src/lib/i18n/translations/vi.ts` (e.g., `admin`, `leads`, `consulting`, `errors`).
2. **Add the Vietnamese value** to `vi.ts`:
   ```ts
   // src/lib/i18n/translations/vi.ts
   export const vi = {
     admin: {
       leads: {
         title: 'Quản lý Khách hàng (Leads)',
         statusNew: 'Mới tiếp nhận'
       }
     }
   }
   ```
3. **Add the exact matching English value** to `src/lib/i18n/translations/en.ts`:
   ```ts
   // src/lib/i18n/translations/en.ts
   export const en = {
     admin: {
       leads: {
         title: 'Customer Leads Management',
         statusNew: 'New Lead'
       }
     }
   }
   ```
4. **Use in Svelte components**:
   ```svelte
   <script lang="ts">
     import { t } from '$lib/i18n/index.js';
   </script>

   <h2>{t('admin.leads.title')}</h2>
   ```
5. **Verify with audit**:
   ```bash
   npm run i18n:audit
   ```
