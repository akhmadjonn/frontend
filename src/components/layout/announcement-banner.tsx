'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useLocaleStore } from '@/stores/locale-store';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Announcement {
  id: string;
  title: { uz: string; uzLatin: string; ru: string };
  content: { uz: string; uzLatin: string; ru: string };
  type: 'info' | 'warning' | 'important';
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { language } = useLocaleStore();

  useEffect(() => {
    apiClient.get<Announcement>('/announcements/active')
      .then(setAnnouncement)
      .catch(() => { /* no active announcement */ });
  }, []);

  if (!announcement || dismissed) return null;

  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100',
    warning: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-100',
    important: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100',
  };

  const t = announcement.content[language] ?? announcement.content.uzLatin;

  return (
    <div className={cn('relative flex items-start gap-2 border-b px-4 py-2.5 text-sm', colors[announcement.type])}>
      <p className="flex-1">{t}</p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Yopish"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
