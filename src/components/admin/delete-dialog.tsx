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
import { useLocale } from '@/hooks/use-locale';

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
  const { ts } = useLocale();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

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
          ? ts('admin.deleteQuestion.permanentDeleted')
          : ts('admin.deleteQuestion.deleted')
      );
      onDeleted();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : ts('admin.deleteQuestion.deleteError')
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
            {isPermanent ? ts('admin.deleteQuestion.permanentTitle') : ts('admin.deleteQuestion.title')}
          </DialogTitle>
          <DialogDescription>
            {isPermanent
              ? ts('admin.deleteQuestion.permanentDescription')
              : ts('admin.deleteQuestion.description')}
          </DialogDescription>
        </DialogHeader>

        {isPermanent && (
          <div className="space-y-2">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">
                {ts('admin.deleteQuestion.confirmHint').replace('{word}', 'DELETE')}
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
            {ts('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canConfirm || deleting}
          >
            {deleting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {ts('admin.deleteQuestion.deleting')}
              </>
            ) : isPermanent ? (
              ts('admin.deleteQuestion.permanentDeleteBtn')
            ) : (
              ts('common.delete')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
