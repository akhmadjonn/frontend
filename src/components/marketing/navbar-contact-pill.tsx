'use client';

import { Phone } from 'lucide-react';
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from '@/lib/contact';

// Compact tap-to-call pill for the landing navbar — desktop only. Mobile users
// rely on the floating contact button instead so the navbar stays uncluttered.
export default function NavbarContactPill() {
  return (
    <a
      href={CONTACT_PHONE_HREF}
      className="hidden xl:inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50/60"
      aria-label={`Call ${CONTACT_PHONE_DISPLAY}`}
    >
      <Phone className="w-4 h-4 text-blue-600" />
      <span className="tabular-nums">{CONTACT_PHONE_DISPLAY}</span>
    </a>
  );
}
