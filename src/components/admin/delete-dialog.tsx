'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string | null;
  onDeleted: () => void;
  mode: 'deactivate' | 'permanent';
}

export default function DeleteDialog({
  open,
  onOpenChange,
  questionId,
  onDeleted,
  mode,
}: DeleteDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // reset confirmation text when dialog opens/closes or mode changes
  useEffect(() => {
    setConfirmText('');
    setDeleting(false);
  }, [open, mode]);

  const isPermanent = mode === 'permanent';
  const canConfirm = isPermanent ? confirmText === 'DELETE' : true;

  const handleDelete = async () => {
    if (!questionId || !canConfirm) return;

    setDeleting(true);
    try {
      const path = isPermanent
        ? `/admin/questions/${questionId}/permanent`
        : `/admin/questions/${questionId}`;

      await apiClient.delete(path);

      toast.success(
        isPermanent
          ? "Savol butunlay o'chirildi"
          : "Savol o'chirildi (nofaol qilindi)"
      );
      onDeleted();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Savolni o'chirishda xatolik yuz berdi"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${isPermanent ? 'text-destructive' : 'text-yellow-500'}`} />
            {isPermanent ? "Savolni butunlay o'chirish" : "Savolni o'chirish"}
          </DialogTitle>
          <DialogDescription>
            {isPermanent
              ? "Bu amalni ortga qaytarib bo'lmaydi. Savol, barcha javob variantlari va bog'langan rasmlar serverdan butunlay o'chiriladi."
              : "Savol nofaol qilinadi va foydalanuvchilarga ko'rinmaydi. Keyinroq qayta faollashtirish mumkin."}
          </DialogDescription>
        </DialogHeader>

        {isPermanent && (
          <div className="space-y-2">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">
                Tasdiqlash uchun quyidagi maydonga <span className="font-mono font-bold">DELETE</span> so&apos;zini yozing.
              </p>
            </div>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="font-mono"
              autoComplete="off"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Bekor qilish
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canConfirm || deleting}
          >
            {deleting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                O&apos;chirilmoqda...
              </>
            ) : isPermanent ? (
              "Butunlay o'chirish"
            ) : (
              "O'chirish"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
