'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  FileArchive,
  Download,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

type DuplicateStrategy = 'skip' | 'overwrite' | 'merge';

export default function ImportDialog({ open, onOpenChange, onImported }: ImportDialogProps) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [strategy, setStrategy] = useState<DuplicateStrategy>('skip');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setExcelFile(null);
    setZipFile(null);
    setStrategy('skip');
    setUploading(false);
    setResult(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  // drag & drop handlers for Excel
  const handleExcelDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.xlsx'))
      setExcelFile(file);
    else
      toast.error('Faqat .xlsx formatdagi fayl qabul qilinadi');
  }, []);

  // drag & drop handlers for ZIP
  const handleZipDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.zip'))
      setZipFile(file);
    else
      toast.error('Faqat .zip formatdagi fayl qabul qilinadi');
  }, []);

  const preventDefault = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleExcelSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setExcelFile(file);
  };

  const handleZipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setZipFile(file);
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5228/api/v1'}/admin/questions/export-template`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions-template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Shablon yuklab olindi');
    } catch {
      toast.error('Shablonni yuklab olishda xatolik');
    }
  };

  const handleUpload = async () => {
    if (!excelFile) {
      toast.error('Excel faylni tanlang');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('excelFile', excelFile);
      if (zipFile) formData.append('imagesZip', zipFile);
      formData.append('duplicateStrategy', strategy);

      const data = await apiClient.post<ImportResult>('/admin/questions/import', formData);
      setResult(data);

      if (data.imported > 0) {
        toast.success(`${data.imported} ta savol muvaffaqiyatli import qilindi`);
        onImported();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import qilishda xatolik yuz berdi');
    } finally {
      setUploading(false);
    }
  };

  const hasErrors = result && result.errors.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Savollarni import qilish</DialogTitle>
          <DialogDescription>
            Excel fayl va rasmlar arxivini yuklang. Shablon formatiga mos bo&apos;lishi kerak.
          </DialogDescription>
        </DialogHeader>

        {result === null ? (
          <div className="space-y-4">
            {/* Excel file drop zone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Excel fayl (.xlsx) <span className="text-destructive">*</span>
              </label>
              <div
                onDrop={handleExcelDrop}
                onDragOver={preventDefault}
                onDragEnter={preventDefault}
                onClick={() => excelInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-muted/50 ${
                  excelFile ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <FileSpreadsheet className={`h-8 w-8 ${excelFile ? 'text-primary' : 'text-muted-foreground'}`} />
                {excelFile ? (
                  <div className="text-center">
                    <p className="text-sm font-medium">{excelFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(excelFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium">Faylni shu yerga tashlang</p>
                    <p className="text-xs text-muted-foreground">yoki bosib tanlang (.xlsx)</p>
                  </div>
                )}
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleExcelSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* ZIP file drop zone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Rasmlar arxivi (.zip)
              </label>
              <div
                onDrop={handleZipDrop}
                onDragOver={preventDefault}
                onDragEnter={preventDefault}
                onClick={() => zipInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary/50 hover:bg-muted/50 ${
                  zipFile ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <FileArchive className={`h-8 w-8 ${zipFile ? 'text-primary' : 'text-muted-foreground'}`} />
                {zipFile ? (
                  <div className="text-center">
                    <p className="text-sm font-medium">{zipFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(zipFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium">Rasmlar arxivini shu yerga tashlang</p>
                    <p className="text-xs text-muted-foreground">ixtiyoriy (.zip)</p>
                  </div>
                )}
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleZipSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Duplicate strategy */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Dublikat strategiyasi
              </label>
              <Select value={strategy} onValueChange={(v) => setStrategy(v as DuplicateStrategy)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Tashlab ketish (mavjudlarni o&apos;zgartirmaydi)</SelectItem>
                  <SelectItem value="overwrite">Qayta yozish (mavjudlarni yangilaydi)</SelectItem>
                  <SelectItem value="merge">Birlashtirish (faqat bo&apos;sh maydonlarni to&apos;ldiradi)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template download link */}
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
            >
              <Download className="h-4 w-4" />
              Shablon yuklab olish
            </button>
          </div>
        ) : (
          // Results display
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-lg border bg-green-50 p-3 dark:bg-green-950/20">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Import qilindi</p>
                  <p className="text-lg font-semibold text-green-700 dark:text-green-400">{result.imported}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-yellow-50 p-3 dark:bg-yellow-950/20">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-xs text-muted-foreground">Tashlab ketildi</p>
                  <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">{result.skipped}</p>
                </div>
              </div>
            </div>

            {hasErrors && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">
                  Xatoliklar ({result.errors.length})
                </p>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <ul className="space-y-1">
                    {result.errors.map((error, i) => (
                      <li key={i} className="text-xs text-destructive">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {result === null ? (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={uploading}>
                Bekor qilish
              </Button>
              <Button onClick={handleUpload} disabled={!excelFile || uploading}>
                {uploading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Yuklanmoqda...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import qilish
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => handleOpenChange(false)}>Yopish</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
