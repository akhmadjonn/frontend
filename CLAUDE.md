# Frontend Agent Instructions — Avtolider Next.js 15

Read the root CLAUDE.md first.

## Your Scope
You own everything in frontend/. MUST NOT modify backend/ or infrastructure/.

## Packages
next 15, react 19, zustand 5, recharts 2, react-hook-form 7, @hookform/resolvers, zod 3, lucide-react, next-intl 3, clsx, tailwind-merge, date-fns 4
Dev: typescript 5, tailwindcss 4, openapi-typescript 7, @testing-library/react 16, vitest 2
UI: shadcn/ui (button, card, input, dialog, progress, badge, tabs, dropdown-menu, avatar, separator, skeleton, toast, alert, sheet, switch, select, radio-group)

## Route Structure
(marketing)/: landing page.tsx, pricing/page.tsx, about/page.tsx — SSR/SSG, public, SEO
(auth)/: login/page.tsx (phone+OTP, Telegram button), verify/page.tsx (4-digit OTP)
(app)/: layout.tsx (sidebar+header), dashboard/page.tsx, practice/page.tsx + session/page.tsx + marathon/page.tsx, exam/page.tsx (3 modes: random/ticket/marathon) + session/[id]/page.tsx + result/[id]/page.tsx, progress/page.tsx, subscription/page.tsx, settings/page.tsx
(admin)/: layout.tsx (grouped sidebar), admin/page.tsx, admin/questions/page.tsx, admin/categories/page.tsx, admin/exam-templates/page.tsx, admin/plans/page.tsx, admin/payments/page.tsx, admin/users/page.tsx, admin/users/[id]/page.tsx, admin/announcements/page.tsx, admin/audit-log/page.tsx, admin/settings/page.tsx

## Key Components
auth/: phone-input.tsx (+998 mask), otp-input.tsx (4 boxes, auto-focus, auto-submit), telegram-login-button.tsx, auth-guard.tsx
exam/: question-card.tsx (handles ALL 4 image scenarios), exam-timer.tsx (mm:ss, red<60s, auto-submit), question-navigator.tsx (grid), exam-result-summary.tsx, answer-option.tsx (text list OR image card grid — auto-detect)
practice/: practice-question.tsx, explanation-panel.tsx, category-selector.tsx
progress/: accuracy-chart.tsx, category-radar.tsx, streak-calendar.tsx, stats-cards.tsx
layout/: sidebar.tsx, header.tsx (language toggle: UZ Lotin / UZ Kirill / Рус + user menu), footer.tsx, mobile-nav.tsx

## Zustand Stores
auth-store: user, tokens, login(), logout(), refresh()
exam-store: examId, questions[], currentIndex, answers Map, expiresAt, status, tabSwitchCount, mode (exam/ticket/marathon)
practice-store: questions[], currentIndex, answers, batchComplete
locale-store: language ('uz'|'uzLatin'|'ru'), setLanguage() — THREE language options

## Language Toggle (3 options)
Header shows: [UZ Lotin] [UZ Kirill] [Рус]
- UZ Lotin = Uzbek Latin script (default)
- UZ Kirill = Uzbek Cyrillic script
- Рус = Russian
Content from API uses Accept-Language header. UI text in src/i18n/uz-latin.json + uz-cyrillic.json + ru.json

## Exam Start Page — Three Modes
1. "Imtihon" (Exam): random 20 questions, 25 min timer, matching real UBDD exam
2. "Bilet" (Ticket): select ticket 1-57+, get that ticket's fixed 20 questions, 25 min timer
3. "Marafon": scoped pool (All / Category / Ticket range), NO timer, paginated batch loading, progress saves, can resume. Explanations shown mid-session.

## Critical Rules
1. NEVER hardcode question text — always from API
2. Instant verdict on every answer submit — `POST /exams/{id}/answer` returns {isCorrect, correctAnswerId, explanation?}. Lock first answer (no re-pick). Explanation rendered only for Marafon mode mid-session; Exam / Ticket / SpeedChallenge defer explanations to the result page.
3. Timer source = server expires_at (NOT local countdown)
4. All images via MinIO presigned URLs, never base64
5. Mobile-first responsive, loading skeletons, error boundaries on every route
6. Question card auto-detects image layout: text-only list vs 2-column image grid
