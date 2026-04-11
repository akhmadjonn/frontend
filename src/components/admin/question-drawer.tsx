'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { apiClient } from '@/lib/api-client';
import type { AdminQuestionDto, CategoryDto } from '@/types/admin';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { useLocaleStore } from '@/stores/locale-store';

interface AnswerOptionForm {
  id?: string;
  textUz: string;
  textUzLatin: string;
  textRu: string;
  isCorrect: boolean;
  imageFile?: File | null;
  existingImageUrl?: string | null;
  removeImage?: boolean;
}

interface FlatCategory {
  id: string;
  name: string;
  depth: number;
}

interface QuestionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: AdminQuestionDto | null;
  categories: CategoryDto[];
  onSaved: () => void;
}

function flattenCategories(categories: CategoryDto[], locale: 'uz' | 'uzLatin' | 'ru', depth = 0): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const cat of categories) {
    const localizedName = cat.name[locale] || cat.name.uzLatin || cat.name.uz;
    result.push({
      id: cat.id,
      name: depth > 0 ? `  ${'  '.repeat(depth - 1)}${localizedName}` : localizedName,
      depth,
    });
    if (cat.children?.length)
      result.push(...flattenCategories(cat.children, locale, depth + 1));
  }
  return result;
}

function createEmptyOption(): AnswerOptionForm {
  return {
    textUz: '',
    textUzLatin: '',
    textRu: '',
    isCorrect: false,
    imageFile: null,
    existingImageUrl: null,
    removeImage: false,
  };
}

export function QuestionDrawer({ open, onOpenChange, question, categories, onSaved }: QuestionDrawerProps) {
  const { ts } = useLocale();
  const locale = (useLocaleStore().language as 'uz' | 'uzLatin' | 'ru') || 'uzLatin';
  const isEdit = !!question;
  const flatCategories = flattenCategories(categories, locale);

  // form state
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [ticketNumber, setTicketNumber] = useState('1');
  const [licenseCategory, setLicenseCategory] = useState('AB');
  const [questionStatus, setQuestionStatus] = useState<'active' | 'archived'>('active');

  // localized texts
  const [textUz, setTextUz] = useState('');
  const [textUzLatin, setTextUzLatin] = useState('');
  const [textRu, setTextRu] = useState('');
  const [explanationUz, setExplanationUz] = useState('');
  const [explanationUzLatin, setExplanationUzLatin] = useState('');
  const [explanationRu, setExplanationRu] = useState('');

  // question image
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null);
  const [existingQuestionImageUrl, setExistingQuestionImageUrl] = useState<string | null>(null);
  const [removeQuestionImage, setRemoveQuestionImage] = useState(false);

  // answer options
  const [options, setOptions] = useState<AnswerOptionForm[]>([
    { ...createEmptyOption(), isCorrect: true },
    createEmptyOption(),
  ]);

  const [submitting, setSubmitting] = useState(false);

  // file input refs
  const questionImageInputRef = useRef<HTMLInputElement>(null);

  // populate form when editing
  const resetForm = useCallback(() => {
    if (question) {
      setCategoryId(question.categoryId);
      setDifficulty(String(question.difficulty));
      setTicketNumber(String(question.ticketNumber));
      setLicenseCategory(question.licenseCategory === 'Both' ? 'BOTH' : question.licenseCategory);
      setQuestionStatus(question.status === 'active' ? 'active' : 'archived');

      setTextUz(question.text.uz || '');
      setTextUzLatin(question.text.uzLatin || '');
      setTextRu(question.text.ru || '');
      setExplanationUz(question.explanation.uz || '');
      setExplanationUzLatin(question.explanation.uzLatin || '');
      setExplanationRu(question.explanation.ru || '');

      setQuestionImageFile(null);
      setExistingQuestionImageUrl(question.imageUrl);
      setRemoveQuestionImage(false);

      setOptions(
        question.answerOptions.map((opt) => ({
          id: opt.id,
          textUz: opt.text.uz || '',
          textUzLatin: opt.text.uzLatin || '',
          textRu: opt.text.ru || '',
          isCorrect: opt.isCorrect,
          imageFile: null,
          existingImageUrl: opt.imageUrl,
          removeImage: false,
        }))
      );
    } else {
      setCategoryId('');
      setDifficulty('easy');
      setTicketNumber('1');
      setLicenseCategory('AB');
      setQuestionStatus('active');

      setTextUz('');
      setTextUzLatin('');
      setTextRu('');
      setExplanationUz('');
      setExplanationUzLatin('');
      setExplanationRu('');

      setQuestionImageFile(null);
      setExistingQuestionImageUrl(null);
      setRemoveQuestionImage(false);

      setOptions([
        { ...createEmptyOption(), isCorrect: true },
        createEmptyOption(),
      ]);
    }
  }, [question]);

  useEffect(() => {
    if (open)
      resetForm();
  }, [open, resetForm]);

  // option management
  const addOption = () => {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, createEmptyOption()]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (!next.some((o) => o.isCorrect) && next.length > 0)
        next[0].isCorrect = true;
      return next;
    });
  };

  const updateOption = (index: number, updates: Partial<AnswerOptionForm>) => {
    setOptions((prev) =>
      prev.map((opt, i) => {
        if (i !== index) return opt;
        return { ...opt, ...updates };
      })
    );
  };

  const setCorrectOption = (index: number) => {
    setOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      }))
    );
  };

  // validation
  const validate = (): string | null => {
    if (!categoryId)
      return ts('admin.questionForm.categoryRequired');
    if (!textUzLatin.trim())
      return ts('admin.questionForm.textRequired');
    if (options.length < 2)
      return ts('admin.questionForm.minOptions');
    if (!options.some((o) => o.isCorrect))
      return ts('admin.questionForm.correctRequired');
    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1)
      return ts('admin.questionForm.oneCorrect');

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      if (!opt.textUzLatin.trim() && !opt.imageFile && !opt.existingImageUrl)
        return `${i + 1}${ts('admin.questionForm.optionRequired')}`;
    }

    return null;
  };

  // submit
  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append('categoryId', categoryId);
      formData.append('textUz', textUz);
      formData.append('textUzLatin', textUzLatin);
      formData.append('textRu', textRu);
      if (explanationUz) formData.append('explanationUz', explanationUz);
      if (explanationUzLatin) formData.append('explanationUzLatin', explanationUzLatin);
      if (explanationRu) formData.append('explanationRu', explanationRu);
      formData.append('difficulty', difficulty);
      formData.append('ticketNumber', ticketNumber);
      formData.append('licenseCategory', licenseCategory);
      formData.append('status', questionStatus);

      if (questionImageFile)
        formData.append('questionImage', questionImageFile);

      if (isEdit) {
        const keepImage = !removeQuestionImage && !questionImageFile && !!existingQuestionImageUrl;
        formData.append('keepQuestionImage', String(keepImage));
      }

      options.forEach((opt, i) => {
        formData.append(`options[${i}].textUz`, opt.textUz);
        formData.append(`options[${i}].textUzLatin`, opt.textUzLatin);
        formData.append(`options[${i}].textRu`, opt.textRu);
        formData.append(`options[${i}].isCorrect`, String(opt.isCorrect));

        if (opt.imageFile)
          formData.append(`options[${i}].image`, opt.imageFile);

        if (isEdit) {
          const keepOptImage = !opt.removeImage && !opt.imageFile && !!opt.existingImageUrl;
          formData.append(`keepOptionImages[${i}]`, String(keepOptImage));
        }
      });

      if (isEdit) {
        await apiClient.put(`/admin/questions/${question!.id}`, formData);
        toast.success(ts('admin.questionForm.updated'));
      } else {
        await apiClient.post('/admin/questions', formData);
        toast.success(ts('admin.questionForm.created'));
      }

      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // image preview helper
  const getQuestionImagePreview = (): string | null => {
    if (questionImageFile)
      return URL.createObjectURL(questionImageFile);
    if (!removeQuestionImage && existingQuestionImageUrl)
      return existingQuestionImageUrl;
    return null;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? ts('admin.questionForm.editTitle') : ts('admin.questionForm.addTitle')}
          </SheetTitle>
          <SheetDescription>
            {isEdit ? ts('admin.questionForm.editDesc') : ts('admin.questionForm.addDesc')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          {/* Category & Difficulty row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{ts('admin.questionForm.categoryLabel')} *</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v as string)}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder={ts('admin.questionForm.categoryPlaceholder')}>
                    {flatCategories.find(c => c.id === categoryId)?.name ?? ts('admin.questionForm.categoryPlaceholder')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {flatCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{ts('admin.questionForm.difficultyLabel')}</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {difficulty === 'easy' ? ts('admin.questions.easy') : difficulty === 'medium' ? ts('admin.questions.medium') : ts('admin.questions.hard')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{ts('admin.questions.easy')}</SelectItem>
                  <SelectItem value="medium">{ts('admin.questions.medium')}</SelectItem>
                  <SelectItem value="hard">{ts('admin.questions.hard')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ticket number, License category, Active toggle */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{ts('admin.questionForm.ticketLabel')}</Label>
              <Input
                type="number"
                min={1}
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{ts('admin.questionForm.licenseLabel')}</Label>
              <Select value={licenseCategory} onValueChange={(v) => setLicenseCategory(v as string)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AB">AB</SelectItem>
                  <SelectItem value="CD">CD</SelectItem>
                  <SelectItem value="BOTH">{ts('admin.questionForm.licenseBoth')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2 pb-0.5">
              <Switch
                checked={questionStatus === 'active'}
                onCheckedChange={(checked) => setQuestionStatus(checked ? 'active' : 'archived')}
              />
              <Label className="cursor-pointer" onClick={() => setQuestionStatus(questionStatus === 'active' ? 'archived' : 'active')}>
                {questionStatus === 'active' ? ts('admin.active') : ts('admin.inactive')}
              </Label>
            </div>
          </div>

          {/* Language tabs for question text + explanation */}
          <div className="space-y-1.5">
            <Label>{ts('admin.questionForm.textLabel')}</Label>
            <Tabs defaultValue="uzLatin">
              <TabsList>
                <TabsTrigger value="uzLatin">{ts('admin.langUzLatin')}</TabsTrigger>
                <TabsTrigger value="uz">{ts('admin.langUzCyrillic')}</TabsTrigger>
                <TabsTrigger value="ru">{ts('admin.langRussian')}</TabsTrigger>
              </TabsList>

              <TabsContent value="uzLatin">
                <div className="space-y-3 pt-2">
                  <Textarea
                    placeholder="Savol matni (UZ Lotin) *"
                    value={textUzLatin}
                    onChange={(e) => setTextUzLatin(e.target.value)}
                    rows={3}
                  />
                  <Textarea
                    placeholder="Izoh (UZ Lotin)"
                    value={explanationUzLatin}
                    onChange={(e) => setExplanationUzLatin(e.target.value)}
                    rows={2}
                  />
                </div>
              </TabsContent>

              <TabsContent value="uz">
                <div className="space-y-3 pt-2">
                  <Textarea
                    placeholder="Савол матни (Кирилл)"
                    value={textUz}
                    onChange={(e) => setTextUz(e.target.value)}
                    rows={3}
                  />
                  <Textarea
                    placeholder="Изоҳ (Кирилл)"
                    value={explanationUz}
                    onChange={(e) => setExplanationUz(e.target.value)}
                    rows={2}
                  />
                </div>
              </TabsContent>

              <TabsContent value="ru">
                <div className="space-y-3 pt-2">
                  <Textarea
                    placeholder="Текст вопроса (Русский)"
                    value={textRu}
                    onChange={(e) => setTextRu(e.target.value)}
                    rows={3}
                  />
                  <Textarea
                    placeholder="Пояснение (Русский)"
                    value={explanationRu}
                    onChange={(e) => setExplanationRu(e.target.value)}
                    rows={2}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Question image */}
          <div className="space-y-1.5">
            <Label>{ts('admin.questionForm.imageLabel')}</Label>
            {(() => {
              const preview = getQuestionImagePreview();
              if (preview)
                return (
                  <div className="relative inline-block">
                    <img
                      src={preview}
                      alt={ts('admin.questionForm.imageLabel')}
                      className="h-32 w-auto rounded-lg border object-cover"
                    />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                      onClick={() => {
                        setQuestionImageFile(null);
                        setRemoveQuestionImage(true);
                        if (questionImageInputRef.current)
                          questionImageInputRef.current.value = '';
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );

              return (
                <div
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-6 transition-colors hover:border-muted-foreground/50 hover:bg-muted/50"
                  onClick={() => questionImageInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground">
                    {ts('admin.questionForm.imageUpload')}
                  </span>
                </div>
              );
            })()}
            <input
              ref={questionImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setQuestionImageFile(file);
                  setRemoveQuestionImage(false);
                }
              }}
            />
          </div>

          {/* Answer options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{ts('admin.questionForm.optionsLabel')}</Label>
              <span className="text-xs text-muted-foreground">
                {options.length}/6
              </span>
            </div>

            {options.map((opt, index) => (
              <AnswerOptionRow
                key={index}
                option={opt}
                index={index}
                canRemove={options.length > 2}
                onUpdate={(updates) => updateOption(index, updates)}
                onSetCorrect={() => setCorrectOption(index)}
                onRemove={() => removeOption(index)}
              />
            ))}

            {options.length < 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={addOption}
              >
                <Plus className="h-4 w-4" />
                {ts('admin.questionForm.addOption')}
              </Button>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {ts('common.cancel')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? ts('common.save') : ts('common.create')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AnswerOptionRow({
  option,
  index,
  canRemove,
  onUpdate,
  onSetCorrect,
  onRemove,
}: {
  option: AnswerOptionForm;
  index: number;
  canRemove: boolean;
  onUpdate: (updates: Partial<AnswerOptionForm>) => void;
  onSetCorrect: () => void;
  onRemove: () => void;
}) {
  const { ts } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imagePreview = (() => {
    if (option.imageFile)
      return URL.createObjectURL(option.imageFile);
    if (!option.removeImage && option.existingImageUrl)
      return option.existingImageUrl;
    return null;
  })();

  return (
    <div className={`rounded-lg border p-3 ${option.isCorrect ? 'border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Correct answer radio */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <button
            type="button"
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              option.isCorrect
                ? 'border-green-600 bg-green-600'
                : 'border-muted-foreground/30 hover:border-green-400'
            }`}
            onClick={onSetCorrect}
            title={ts('common.correct')}
          >
            {option.isCorrect && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6L5 8.5L9.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className="text-[10px] font-medium text-muted-foreground">
            {String.fromCharCode(65 + index)}
          </span>
        </div>

        {/* Text fields */}
        <div className="flex-1 space-y-2">
          <Input
            placeholder={`Variant ${String.fromCharCode(65 + index)} (UZ Lotin)`}
            value={option.textUzLatin}
            onChange={(e) => onUpdate({ textUzLatin: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Кирилл"
              value={option.textUz}
              onChange={(e) => onUpdate({ textUz: e.target.value })}
            />
            <Input
              placeholder="Русский"
              value={option.textRu}
              onChange={(e) => onUpdate({ textRu: e.target.value })}
            />
          </div>

          {/* Option image */}
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt={`Variant ${String.fromCharCode(65 + index)}`}
                className="h-20 w-auto rounded border object-cover"
              />
              <button
                type="button"
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                onClick={() => {
                  onUpdate({ imageFile: null, removeImage: true });
                  if (fileInputRef.current)
                    fileInputRef.current.value = '';
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded border border-dashed px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              {ts('admin.questionForm.addImage')}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file)
                onUpdate({ imageFile: file, removeImage: false });
            }}
          />
        </div>

        {/* Remove button */}
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
