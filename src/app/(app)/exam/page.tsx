'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useExamStore } from '@/stores/exam-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Hash, Trophy, Clock, Timer } from 'lucide-react';
import { EXAM_QUESTION_COUNT, EXAM_PASSING_SCORE } from '@/lib/constants';
import Link from 'next/link';

type ExamMode = 'exam' | 'ticket' | 'marathon';

interface AnswerOptionDto {
  id: string;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
}

interface ExamQuestionDto {
  id: string;
  questionId: string;
  order: number;
  text: { uz: string; uzLatin: string; ru: string };
  imageUrl: string | null;
  answerOptions: AnswerOptionDto[];
}

interface ExamSessionDto {
  id: string;
  status: string;
  totalQuestions: number;
  passingScore: number;
  timeLimitMinutes: number;
  expiresAt: string | null;
  mode: ExamMode;
  ticketNumber: number | null;
  questions: ExamQuestionDto[];
}

const TICKET_NUMBERS = Array.from({ length: 57 }, (_, i) => i + 1);

export default function ExamPage() {
  const router = useRouter();
  const { startExam } = useExamStore();
  const [loading, setLoading] = useState<ExamMode | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<number>(1);

  const handleStart = async (mode: ExamMode) => {
    setLoading(mode);
    try {
      let data: ExamSessionDto;
      if (mode === 'exam') {
        data = await apiClient.post<ExamSessionDto>('/exams/start', { licenseCategory: 'AB' });
      } else if (mode === 'ticket') {
        data = await apiClient.post<ExamSessionDto>('/exams/start-ticket', { ticketNumber: selectedTicket });
      } else {
        data = await apiClient.post<ExamSessionDto>('/exams/start-marathon', {});
      }
      startExam(data.id, data.questions, data.expiresAt, mode);
      router.push(`/exam/session/${data.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Imtihon</h1>
        <p className="text-sm text-muted-foreground mt-1">Rejim tanlang va imtihonni boshlang</p>
      </div>

      <div className="grid gap-4">
        {/* Exam mode */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <div className="absolute right-3 top-3">
            <Badge variant="secondary">Haqiqiy imtihon</Badge>
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Imtihon (Sinov)</CardTitle>
                <p className="text-xs text-muted-foreground">UBDD imtihoniga tayyorlanish</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />{EXAM_QUESTION_COUNT} savol</span>
              <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" />25 daqiqa</span>
              <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5" />O&apos;tish: {EXAM_PASSING_SCORE}/{EXAM_QUESTION_COUNT}</span>
            </div>
            <Button className="w-full" onClick={() => handleStart('exam')} disabled={loading !== null}>
              {loading === 'exam' ? 'Yuklanmoqda...' : 'Imtihonni boshlash'}
            </Button>
          </CardContent>
        </Card>

        {/* Ticket mode */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Hash className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">Bilet (Ticket)</CardTitle>
                <p className="text-xs text-muted-foreground">Bilet raqami bo&apos;yicha savollar</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />20 savol</span>
              <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" />25 daqiqa</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />57 bilet</span>
            </div>
            <div className="flex gap-2">
              <Select value={String(selectedTicket)} onValueChange={(v) => setSelectedTicket(Number(v))}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Bilet tanlang" />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {TICKET_NUMBERS.map((n) => (
                    <SelectItem key={n} value={String(n)}>Bilet #{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => handleStart('ticket')} disabled={loading !== null} className="shrink-0">
                {loading === 'ticket' ? '...' : 'Boshlash'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Marathon mode */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">Maraton</CardTitle>
                <p className="text-xs text-muted-foreground">Barcha 1200+ savol, taymer yo&apos;q</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />1200+ savol</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Jarayon saqlanadi</span>
            </div>
            <Button variant="outline" className="w-full" onClick={() => handleStart('marathon')} disabled={loading !== null}>
              {loading === 'marathon' ? 'Yuklanmoqda...' : 'Maratonni boshlash'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Link href="/progress" className="text-sm text-primary hover:underline">
          Imtihon tarixini ko&apos;rish
        </Link>
      </div>
    </div>
  );
}
