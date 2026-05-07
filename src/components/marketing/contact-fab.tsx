'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Phone, Send, X } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import {
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  CONTACT_TELEGRAM_DISPLAY,
  CONTACT_TELEGRAM_URL,
} from '@/lib/contact';

const PULSE_SEEN_KEY = 'avtolider:contact-pulse-seen';
const PULSE_DURATION_MS = 6000;

const noopSubscribe = () => () => {};

// Server snapshot is false (no sessionStorage there); client snapshot reads
// the seen-flag. Returning identical values each call keeps useSyncExternalStore
// stable until something writes to sessionStorage and triggers a re-render.
function useShouldPulse(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => typeof window !== 'undefined' && sessionStorage.getItem(PULSE_SEEN_KEY) === null,
    () => false,
  );
}

export default function ContactFab() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const shouldPulse = useShouldPulse();
  const { ts } = useLocale();

  // Mark the pulse as seen after the CSS animation finishes so it doesn't
  // re-trigger on the same tab. Effect has no setState — lint-clean.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(PULSE_SEEN_KEY) !== null) return;
    const t = setTimeout(() => sessionStorage.setItem(PULSE_SEEN_KEY, '1'), PULSE_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  // Close on outside click and Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleToggle = () => {
    // Once the user interacts, the pulse has done its job — flag as seen
    // immediately so it doesn't reappear on a re-render after this click.
    if (typeof window !== 'undefined') sessionStorage.setItem(PULSE_SEEN_KEY, '1');
    setOpen((o) => !o);
  };

  return (
    <div ref={panelRef} className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3 print:hidden">
      {/* Expanded panel */}
      {open && (
        <div className="w-72 rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-blue-900/10 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">{ts('contact.helpTitle')}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={ts('contact.close')}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <a
              href={CONTACT_PHONE_HREF}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors group"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Phone className="w-5 h-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-xs text-gray-500">{ts('contact.callUs')}</span>
                <span className="text-sm font-semibold text-gray-900">{CONTACT_PHONE_DISPLAY}</span>
              </span>
            </a>
            <a
              href={CONTACT_TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-sky-200 hover:bg-sky-50/40 transition-colors group"
            >
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-100 text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                <Send className="w-5 h-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-xs text-gray-500">{ts('contact.telegramChannel')}</span>
                <span className="text-sm font-semibold text-gray-900">{CONTACT_TELEGRAM_DISPLAY}</span>
              </span>
            </a>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={open ? ts('contact.close') : ts('contact.openHelp')}
        aria-expanded={open}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200"
      >
        {/* Pulse rings — only visible on first session, self-stopping via
            animation-iteration-count so no setState/re-render needed. */}
        {shouldPulse && !open && (
          <>
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-blue-500"
              style={{ animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) 4 forwards', opacity: 0.55 }}
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-blue-400"
              style={{ animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) 4 forwards', animationDelay: '0.6s', opacity: 0.3 }}
            />
          </>
        )}
        <span className="relative">
          {open ? <X className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
        </span>
      </button>
    </div>
  );
}
