# Frontend Agent Instructions — AutoTest Next.js 15

Read the root CLAUDE.md first.

## Your Scope
You own everything in frontend/. MUST NOT modify backend/ or infrastructure/.

## Packages
next 15, react 19, zustand 5, recharts 2, react-hook-form 7, @hookform/resolvers, zod 3, lucide-react, next-intl 3, clsx, tailwind-merge, date-fns 4
Dev: typescript 5, tailwindcss 4, openapi-typescript 7, @testing-library/react 16, vitest 2
UI: shadcn/ui (button, card, input, dialog, progress, badge, tabs, dropdown-menu, avatar, separator, skeleton, toast, alert, sheet)

## Route Structure
(marketing)/: landing page.tsx, pricing/page.tsx, about/page.tsx — SSR/SSG, public
(auth)/: login/page.tsx (phone+OTP, Telegram button), verify/page.tsx (6-digit OTP input)
(app)/: layout.tsx (sidebar+header), dashboard/page.tsx, practice/page.tsx + session/page.tsx, exam/page.tsx + session/[id]/page.tsx + result/[id]/page.tsx, progress/page.tsx, subscription/page.tsx, settings/page.tsx
(admin)/: layout.tsx (admin sidebar), admin/page.tsx (dashboard), admin/questions/page.tsx, admin/categories/page.tsx, admin/exam-templates/page.tsx, admin/plans/page.tsx, admin/payments/page.tsx (transactions + revenue tabs), admin/users/page.tsx, admin/users/[id]/page.tsx (user detail), admin/announcements/page.tsx, admin/audit-log/page.tsx, admin/settings/page.tsx

## Key Components
auth/: phone-input.tsx (+998 mask, 9 digits, format XX XXX XX XX), otp-input.tsx (6 boxes, auto-focus, auto-submit, paste, 60s resend timer), telegram-login-button.tsx, auth-guard.tsx
exam/: question-card.tsx (text+image+options), exam-timer.tsx (mm:ss, red<60s, auto-submit at 0), question-navigator.tsx (grid: green=answered, blue=current, gray=unanswered), exam-result-summary.tsx (score circle+pass/fail), answer-option.tsx
practice/: practice-question.tsx (instant feedback), explanation-panel.tsx, category-selector.tsx (cards+progress)
progress/: accuracy-chart.tsx (Recharts LineChart), category-radar.tsx (RadarChart), streak-calendar.tsx (heatmap), stats-cards.tsx
layout/: sidebar.tsx, header.tsx (language toggle, user menu), footer.tsx, mobile-nav.tsx (bottom tabs)

## Zustand Stores
auth-store: user, accessToken, refreshToken, login(), logout(), refresh()
exam-store: examId, questions[], currentIndex, answers Map<qId,aId>, expiresAt (server timestamp), status, tabSwitchCount, startExam(), selectAnswer(), goToQuestion(), submitExam()
practice-store: questions[], currentIndex, answers, batchComplete
locale-store: language ('uz'|'ru'), setLanguage()

## API Client Pattern
lib/api-client.ts: fetch wrapper with Bearer token injection, auto 401→refresh→retry, ApiResponse<T> unwrapping, redirect to /login on auth failure

## Exam Session Behavior
Timer from server expires_at (NOT local countdown). Red + pulse when <60s. Auto-submit at 0. Tab switch detection via visibilitychange. CSS user-select:none. beforeunload warning. Correct answers NEVER on client during exam — only after CompleteExam API call.

## Practice Behavior
Immediate feedback after each answer. Green=correct, red=wrong with correct shown. Explanation panel below. Progress bar X/10. Leitner box indicator. Session summary at end.

## Design System
Colors: primary=blue-600, success=green-500, danger=red-500, warning=amber-500, bg=slate-50, surface=white
Font: Inter via next/font/google. Mobile-first. Sidebar → bottom tabs on mobile.

## i18n
next-intl. Two locales: uz (Uzbek, default), ru (Russian). API content via Accept-Language header. UI text in src/i18n/uz.json + ru.json.

## PWA
Cache: question images, UI assets, fonts. Offline review of last practice batch. Install prompt after 3rd visit.

## Critical Rules
1. NEVER hardcode question text — always from API
2. Correct answers NEVER on client during exam
3. Timer source = server expires_at
4. All images via MinIO signed URLs, never base64
5. Mobile-first responsive
6. Loading skeletons, not spinners
7. Error boundaries on every route
