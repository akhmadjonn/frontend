'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import type { LocalizedText } from '@/types/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, PlayCircle, Upload, X, Paperclip, FileText } from 'lucide-react';
import { useLocaleStore } from '@/stores/locale-store';
import { useLocale } from '@/hooks/use-locale';

// ── Types ──
interface VideoCategoryAdminDto {
  id: string;
  name: LocalizedText;
  description: LocalizedText | null;
  sortOrder: number;
  isActive: boolean;
  lessonCount: number;
}

interface VideoLessonAdminDto {
  id: string;
  videoCategoryId: string;
  title: LocalizedText;
  description: LocalizedText | null;
  sourceType: string; // 'upload' | 'youTube' | 'externalLink' | 'presentation'
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number;
  sortOrder: number;
  isFree: boolean;
  isDownloadable: boolean;
  isActive: boolean;
  linkedCategoryId: string | null;
}

interface LessonAttachmentDto {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
}

// ── Helpers ──
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function parseDuration(value: string): number {
  const parts = value.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const s = parseInt(parts[1], 10) || 0;
    return m * 60 + s;
  }
  return parseInt(value, 10) || 0;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const SOURCE_TYPES = [
  { value: 'upload' as const, labelKey: 'admin.videoLessons.upload' },
  { value: 'youTube' as const, labelKey: 'admin.videoLessons.youtube' },
  { value: 'externalLink' as const, labelKey: 'admin.videoLessons.externalLink' },
  { value: 'presentation' as const, labelKey: 'admin.videoLessons.presentation' },
];

// ── Category Form ──
interface CategoryFormData {
  nameUz: string;
  nameUzLatin: string;
  nameRu: string;
  descriptionUz: string;
  descriptionUzLatin: string;
  descriptionRu: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyCategoryForm: CategoryFormData = {
  nameUz: '',
  nameUzLatin: '',
  nameRu: '',
  descriptionUz: '',
  descriptionUzLatin: '',
  descriptionRu: '',
  sortOrder: '0',
  isActive: true,
};

function formFromCategory(cat: VideoCategoryAdminDto): CategoryFormData {
  return {
    nameUz: cat.name.uz,
    nameUzLatin: cat.name.uzLatin,
    nameRu: cat.name.ru,
    descriptionUz: cat.description?.uz ?? '',
    descriptionUzLatin: cat.description?.uzLatin ?? '',
    descriptionRu: cat.description?.ru ?? '',
    sortOrder: String(cat.sortOrder),
    isActive: cat.isActive,
  };
}

// ── Lesson Form ──
interface LessonFormData {
  titleUz: string;
  titleUzLatin: string;
  titleRu: string;
  descriptionUz: string;
  descriptionUzLatin: string;
  descriptionRu: string;
  videoCategoryId: string;
  sourceType: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  sortOrder: string;
  isFree: boolean;
  isDownloadable: boolean;
  isActive: boolean;
  linkedCategoryId: string;
}

const emptyLessonForm: LessonFormData = {
  titleUz: '',
  titleUzLatin: '',
  titleRu: '',
  descriptionUz: '',
  descriptionUzLatin: '',
  descriptionRu: '',
  videoCategoryId: '',
  sourceType: 'youTube',
  videoUrl: '',
  thumbnailUrl: '',
  duration: '00:00',
  sortOrder: '0',
  isFree: false,
  isDownloadable: false,
  isActive: true,
  linkedCategoryId: '',
};

function formFromLesson(lesson: VideoLessonAdminDto): LessonFormData {
  return {
    titleUz: lesson.title.uz,
    titleUzLatin: lesson.title.uzLatin,
    titleRu: lesson.title.ru,
    descriptionUz: lesson.description?.uz ?? '',
    descriptionUzLatin: lesson.description?.uzLatin ?? '',
    descriptionRu: lesson.description?.ru ?? '',
    videoCategoryId: lesson.videoCategoryId,
    sourceType: lesson.sourceType,
    videoUrl: lesson.videoUrl ?? '',
    thumbnailUrl: lesson.thumbnailUrl ?? '',
    duration: formatDuration(lesson.durationSeconds),
    sortOrder: String(lesson.sortOrder),
    isFree: lesson.isFree,
    isDownloadable: lesson.isDownloadable,
    isActive: lesson.isActive,
    linkedCategoryId: lesson.linkedCategoryId ?? '',
  };
}

export default function VideoLessonsPage() {
  const { language } = useLocaleStore();
  const { t, ts } = useLocale();
  const lang = language as keyof LocalizedText;

  const [activeTab, setActiveTab] = useState('categories');

  // ── Categories State ──
  const [categories, setCategories] = useState<VideoCategoryAdminDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VideoCategoryAdminDto | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(emptyCategoryForm);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<VideoCategoryAdminDto | null>(null);
  const [deletingCategoryLoading, setDeletingCategoryLoading] = useState(false);

  // ── Lessons State ──
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [lessons, setLessons] = useState<VideoLessonAdminDto[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<VideoLessonAdminDto | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonFormData>(emptyLessonForm);
  const [lessonSubmitting, setLessonSubmitting] = useState(false);
  const [deleteLessonDialogOpen, setDeleteLessonDialogOpen] = useState(false);
  const [deletingLesson, setDeletingLesson] = useState<VideoLessonAdminDto | null>(null);
  const [deletingLessonLoading, setDeletingLessonLoading] = useState(false);

  // ── File Uploads ──
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<LessonAttachmentDto[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const pdfFileRef = useRef<HTMLInputElement>(null);
  const thumbnailFileRef = useRef<HTMLInputElement>(null);
  const attachmentFileRef = useRef<HTMLInputElement>(null);

  // Question categories for linked category dropdown
  const [questionCategories, setQuestionCategories] = useState<{ id: string; name: LocalizedText }[]>([]);

  useEffect(() => {
    apiClient.get<{ id: string; name: LocalizedText }[]>('/categories')
      .then((data) => setQuestionCategories(data))
      .catch(() => {});
  }, []);

  const getText = (text: LocalizedText | null | undefined) => {
    if (!text) return '--';
    return text[lang] || text.uzLatin;
  };

  // ── Fetch Categories ──
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const data = await apiClient.get<VideoCategoryAdminDto[]>('/admin/video-lessons/categories');
      setCategories(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ── Fetch Lessons ──
  const fetchLessons = useCallback(async () => {
    setLoadingLessons(true);
    try {
      const query = filterCategoryId && filterCategoryId !== 'all' ? `?categoryId=${filterCategoryId}` : '';
      const data = await apiClient.get<VideoLessonAdminDto[]>(`/admin/video-lessons${query}`);
      setLessons(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLoadingLessons(false);
    }
  }, [filterCategoryId]);

  useEffect(() => {
    if (activeTab === 'lessons')
      fetchLessons();
  }, [activeTab, fetchLessons]);

  // ── Category CRUD ──
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (cat: VideoCategoryAdminDto) => {
    setEditingCategory(cat);
    setCategoryForm(formFromCategory(cat));
    setCategoryDialogOpen(true);
  };

  const openDeleteCategory = (cat: VideoCategoryAdminDto) => {
    setDeletingCategory(cat);
    setDeleteCategoryDialogOpen(true);
  };

  const updateCategoryField = <K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) => {
    setCategoryForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCategorySubmit = async () => {
    if (!categoryForm.nameUzLatin.trim()) {
      toast.error(ts('admin.videoLessons.categoryNameRequired'));
      return;
    }

    setCategorySubmitting(true);
    try {
      const payload = {
        nameUz: categoryForm.nameUz,
        nameUzLatin: categoryForm.nameUzLatin,
        nameRu: categoryForm.nameRu,
        descriptionUz: categoryForm.descriptionUz || null,
        descriptionUzLatin: categoryForm.descriptionUzLatin || null,
        descriptionRu: categoryForm.descriptionRu || null,
        sortOrder: Number(categoryForm.sortOrder) || 0,
        ...(editingCategory ? { isActive: categoryForm.isActive } : {}),
      };

      if (editingCategory) {
        await apiClient.put(`/admin/video-lessons/categories/${editingCategory.id}`, payload);
        toast.success(ts('admin.videoLessons.categoryUpdated'));
      } else {
        await apiClient.post('/admin/video-lessons/categories', payload);
        toast.success(ts('admin.videoLessons.categoryCreated'));
      }

      setCategoryDialogOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setDeletingCategoryLoading(true);
    try {
      await apiClient.delete(`/admin/video-lessons/categories/${deletingCategory.id}`);
      toast.success(ts('admin.videoLessons.categoryDeleted'));
      setDeleteCategoryDialogOpen(false);
      setDeletingCategory(null);
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setDeletingCategoryLoading(false);
    }
  };

  // ── Lesson CRUD ──
  const openCreateLesson = () => {
    setEditingLesson(null);
    setLessonForm({ ...emptyLessonForm, videoCategoryId: filterCategoryId !== 'all' ? filterCategoryId : '' });
    setSelectedVideo(null);
    setSelectedThumbnail(null);
    setThumbnailPreview(null);
    setAttachments([]);
    setLessonDialogOpen(true);
  };

  const openEditLesson = (lesson: VideoLessonAdminDto) => {
    setEditingLesson(lesson);
    setLessonForm(formFromLesson(lesson));
    setSelectedVideo(null);
    setSelectedThumbnail(null);
    setThumbnailPreview(lesson.thumbnailUrl);
    setAttachments([]);
    setLessonDialogOpen(true);
  };

  const openDeleteLesson = (lesson: VideoLessonAdminDto) => {
    setDeletingLesson(lesson);
    setDeleteLessonDialogOpen(true);
  };

  const updateLessonField = <K extends keyof LessonFormData>(key: K, value: LessonFormData[K]) => {
    setLessonForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLessonSubmit = async () => {
    if (!lessonForm.titleUzLatin.trim()) {
      toast.error(ts('admin.videoLessons.lessonTitleRequired'));
      return;
    }
    if (!lessonForm.videoCategoryId) {
      toast.error(ts('admin.videoLessons.categoryRequired'));
      return;
    }

    setLessonSubmitting(true);
    try {
      const payload = {
        videoCategoryId: lessonForm.videoCategoryId,
        titleUz: lessonForm.titleUz,
        titleUzLatin: lessonForm.titleUzLatin,
        titleRu: lessonForm.titleRu,
        descriptionUz: lessonForm.descriptionUz || null,
        descriptionUzLatin: lessonForm.descriptionUzLatin || null,
        descriptionRu: lessonForm.descriptionRu || null,
        sourceType: lessonForm.sourceType,
        videoUrl: lessonForm.sourceType !== 'upload' && lessonForm.sourceType !== 'presentation' ? lessonForm.videoUrl : 'pending-upload',
        linkedCategoryId: lessonForm.linkedCategoryId || null,
        thumbnailUrl: lessonForm.thumbnailUrl || null,
        durationSeconds: parseDuration(lessonForm.duration),
        sortOrder: Number(lessonForm.sortOrder) || 0,
        isFree: lessonForm.isFree,
        isDownloadable: lessonForm.isDownloadable,
        ...(editingLesson ? { isActive: lessonForm.isActive } : {}),
      };

      let lessonId: string;

      if (editingLesson) {
        await apiClient.put(`/admin/video-lessons/${editingLesson.id}`, payload);
        lessonId = editingLesson.id;
        toast.success(ts('admin.videoLessons.lessonUpdated'));
      } else {
        const id = await apiClient.post<string>('/admin/video-lessons', payload);
        lessonId = id;
        toast.success(ts('admin.videoLessons.lessonCreated'));
      }

      // Upload video/PDF file if selected (sourceType = Upload or Presentation)
      if (selectedVideo && (lessonForm.sourceType === 'upload' || lessonForm.sourceType === 'presentation')) {
        setUploadingVideo(true);
        try {
          const formData = new FormData();
          formData.append('file', selectedVideo);
          const result = await apiClient.post<{ videoUrl: string }>(`/admin/video-lessons/${lessonId}/upload`, formData);
          if (result?.videoUrl)
            updateLessonField('videoUrl', result.videoUrl);
        } catch {
          toast.error('Video upload failed');
        } finally {
          setUploadingVideo(false);
        }
      }

      // Upload thumbnail if selected
      if (selectedThumbnail) {
        setUploadingThumbnail(true);
        try {
          const formData = new FormData();
          formData.append('image', selectedThumbnail);
          await apiClient.post<{ thumbnailUrl: string }>(`/admin/video-lessons/${lessonId}/thumbnail`, formData);
          toast.success(ts('admin.videoLessons.thumbnailUploaded'));
        } catch {
          toast.error('Thumbnail upload failed');
        } finally {
          setUploadingThumbnail(false);
        }
      }

      setLessonDialogOpen(false);
      setSelectedVideo(null);
      setSelectedThumbnail(null);
      setThumbnailPreview(null);
      fetchLessons();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLessonSubmitting(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deletingLesson) return;
    setDeletingLessonLoading(true);
    try {
      await apiClient.delete(`/admin/video-lessons/${deletingLesson.id}`);
      toast.success(ts('admin.videoLessons.lessonDeleted'));
      setDeleteLessonDialogOpen(false);
      setDeletingLesson(null);
      fetchLessons();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setDeletingLessonLoading(false);
    }
  };

  // ── Attachment Handlers ──
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingLesson) return;
    e.target.value = '';

    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const att = await apiClient.post<LessonAttachmentDto>(`/admin/video-lessons/${editingLesson.id}/attachments`, formData);
      setAttachments((prev) => [...prev, att]);
      toast.success(ts('admin.videoLessons.uploadAttachment'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (!editingLesson) return;
    try {
      await apiClient.delete(`/admin/video-lessons/${editingLesson.id}/attachments/${attachmentId}`);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast.success(ts('admin.videoLessons.removeAttachment'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    }
  };

  const onVideoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedVideo(file);
    e.target.value = '';
  };

  const onThumbnailSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? getText(cat.name) : '--';
  };

  const getSourceTypeLabel = (type: string) => {
    const found = SOURCE_TYPES.find((s) => s.value === type);
    return found ? ts(found.labelKey) : '--';
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">{ts('admin.videoLessons.title')}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v ?? 'categories')}>
        <TabsList>
          <TabsTrigger value="categories" className="data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.videoLessons.categoriesTab')}</TabsTrigger>
          <TabsTrigger value="lessons" className="data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.videoLessons.lessonsTab')}</TabsTrigger>
        </TabsList>

        {/* ── Categories Tab ── */}
        <TabsContent value="categories" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {ts('common.total')}: {categories.length}
            </p>
            <Button className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white" onClick={openCreateCategory}>
              <Plus className="h-4 w-4" />
              {ts('admin.videoLessons.addCategory')}
            </Button>
          </div>

          {loadingCategories ? (
            <div className="rounded-lg border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : !categories.length ? (
            <Card>
              <CardContent className="py-16 text-center">
                <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-1">{ts('admin.videoLessons.noCategories')}</p>
                <p className="text-sm text-muted-foreground mb-4">{ts('admin.videoLessons.createCategoryFirst')}</p>
                <Button onClick={openCreateCategory}>
                  <Plus className="h-4 w-4" />
                  {ts('admin.videoLessons.addCategory')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {ts('admin.plans.nameSection')}
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-24">
                      {ts('admin.videoLessons.lessonCount')}
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">
                      {ts('admin.categories.sortOrder')}
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">
                      {ts('admin.colorVision.status')}
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-24">
                      {ts('admin.fines.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b last:border-b-0 hover:bg-white/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{getText(cat.name)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                          {cat.lessonCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-muted-foreground font-mono">#{cat.sortOrder}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={cat.isActive ? 'default' : 'secondary'} className="text-xs">
                          {cat.isActive ? ts('admin.videoLessons.active') : ts('admin.videoLessons.inactive')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEditCategory(cat)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => openDeleteCategory(cat)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── Lessons Tab ── */}
        <TabsContent value="lessons" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Select value={filterCategoryId} onValueChange={(v) => setFilterCategoryId(v ?? 'all')}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder={ts('admin.videoLessons.allCategories')}>
                  {filterCategoryId === 'all' ? ts('admin.videoLessons.allCategories') : getText(categories.find(c => c.id === filterCategoryId)?.name) || filterCategoryId}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ts('admin.videoLessons.allCategories')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {getText(cat.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white" onClick={openCreateLesson}>
              <Plus className="h-4 w-4" />
              {ts('admin.videoLessons.addLesson')}
            </Button>
          </div>

          {loadingLessons ? (
            <div className="rounded-lg border">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
                  <Skeleton className="h-10 w-16 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : !lessons.length ? (
            <Card>
              <CardContent className="py-16 text-center">
                <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-1">{ts('admin.videoLessons.noLessons')}</p>
                <p className="text-sm text-muted-foreground mb-4">{ts('admin.videoLessons.createLessonFirst')}</p>
                <Button onClick={openCreateLesson}>
                  <Plus className="h-4 w-4" />
                  {ts('admin.videoLessons.addLesson')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {ts('admin.plans.nameSection')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-36">
                      {ts('admin.videoLessons.category')}
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-28">
                      {ts('admin.videoLessons.sourceType')}
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">
                      {ts('admin.videoLessons.duration')}
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">
                      {ts('admin.videoLessons.isFree')}
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">
                      {ts('admin.colorVision.status')}
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-24">
                      {ts('admin.fines.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} className="border-b last:border-b-0 hover:bg-white/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{getText(lesson.title)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{getCategoryName(lesson.videoCategoryId)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="text-xs">
                          {getSourceTypeLabel(lesson.sourceType)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-mono text-muted-foreground">{formatDuration(lesson.durationSeconds)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {lesson.isFree ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300 text-xs">
                            {ts('admin.videoLessons.free')}
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 text-xs">
                            {ts('admin.videoLessons.premium')}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={lesson.isActive ? 'default' : 'secondary'} className="text-xs">
                          {lesson.isActive ? ts('admin.videoLessons.active') : ts('admin.videoLessons.inactive')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEditLesson(lesson)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => openDeleteLesson(lesson)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Category Create/Edit Dialog ── */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? ts('admin.videoLessons.editCategoryTitle') : ts('admin.videoLessons.createCategoryTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{ts('admin.plans.nameSection')}</p>
              <Tabs defaultValue="uzLatin">
                <TabsList className="w-full">
                  <TabsTrigger value="uzLatin" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzLatin')}</TabsTrigger>
                  <TabsTrigger value="uz" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzCyrillic')}</TabsTrigger>
                  <TabsTrigger value="ru" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langRussian')}</TabsTrigger>
                </TabsList>
                <TabsContent value="uzLatin" className="mt-3">
                  <Input
                    value={categoryForm.nameUzLatin}
                    onChange={(e) => updateCategoryField('nameUzLatin', e.target.value)}
                    placeholder="Kategoriya nomi (lotin)"
                  />
                </TabsContent>
                <TabsContent value="uz" className="mt-3">
                  <Input
                    value={categoryForm.nameUz}
                    onChange={(e) => updateCategoryField('nameUz', e.target.value)}
                    placeholder="Категория номи (кирилл)"
                  />
                </TabsContent>
                <TabsContent value="ru" className="mt-3">
                  <Input
                    value={categoryForm.nameRu}
                    onChange={(e) => updateCategoryField('nameRu', e.target.value)}
                    placeholder="Название категории"
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{ts('admin.plans.descSection')}</p>
              <Tabs defaultValue="uzLatin">
                <TabsList className="w-full">
                  <TabsTrigger value="uzLatin" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzLatin')}</TabsTrigger>
                  <TabsTrigger value="uz" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzCyrillic')}</TabsTrigger>
                  <TabsTrigger value="ru" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langRussian')}</TabsTrigger>
                </TabsList>
                <TabsContent value="uzLatin" className="mt-3">
                  <Textarea
                    value={categoryForm.descriptionUzLatin}
                    onChange={(e) => updateCategoryField('descriptionUzLatin', e.target.value)}
                    placeholder="Tavsif (lotin)"
                    rows={3}
                  />
                </TabsContent>
                <TabsContent value="uz" className="mt-3">
                  <Textarea
                    value={categoryForm.descriptionUz}
                    onChange={(e) => updateCategoryField('descriptionUz', e.target.value)}
                    placeholder="Тавсиф (кирилл)"
                    rows={3}
                  />
                </TabsContent>
                <TabsContent value="ru" className="mt-3">
                  <Textarea
                    value={categoryForm.descriptionRu}
                    onChange={(e) => updateCategoryField('descriptionRu', e.target.value)}
                    placeholder="Описание"
                    rows={3}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="catSortOrder">{ts('admin.categories.sortOrder')}</Label>
                <Input
                  id="catSortOrder"
                  type="number"
                  min="0"
                  value={categoryForm.sortOrder}
                  onChange={(e) => updateCategoryField('sortOrder', e.target.value)}
                  placeholder="0"
                />
              </div>
              {editingCategory && (
                <div className="flex items-end pb-1">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={categoryForm.isActive}
                      onCheckedChange={(checked) => updateCategoryField('isActive', checked)}
                    />
                    <Label>{ts('admin.activeState')}</Label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)} disabled={categorySubmitting}>
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleCategorySubmit} disabled={categorySubmitting} className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white">
              {categorySubmitting
                ? ts('admin.saving')
                : editingCategory
                  ? ts('admin.saveBtn')
                  : ts('admin.createBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Category Delete Dialog ── */}
      <Dialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{ts('admin.videoLessons.deleteCategoryTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {ts('admin.videoLessons.deleteCategoryConfirm')}
            {deletingCategory && (
              <span className="font-medium text-foreground"> {getText(deletingCategory.name)}</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategoryDialogOpen(false)} disabled={deletingCategoryLoading}>
              {ts('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={deletingCategoryLoading}>
              {deletingCategoryLoading ? ts('admin.videoLessons.deleting') : ts('admin.videoLessons.deleteBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Lesson Create/Edit Dialog ── */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? ts('admin.videoLessons.editLessonTitle') : ts('admin.videoLessons.createLessonTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{ts('admin.plans.nameSection')}</p>
              <Tabs defaultValue="uzLatin">
                <TabsList className="w-full">
                  <TabsTrigger value="uzLatin" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzLatin')}</TabsTrigger>
                  <TabsTrigger value="uz" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzCyrillic')}</TabsTrigger>
                  <TabsTrigger value="ru" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langRussian')}</TabsTrigger>
                </TabsList>
                <TabsContent value="uzLatin" className="mt-3">
                  <Input
                    value={lessonForm.titleUzLatin}
                    onChange={(e) => updateLessonField('titleUzLatin', e.target.value)}
                    placeholder="Dars nomi (lotin)"
                  />
                </TabsContent>
                <TabsContent value="uz" className="mt-3">
                  <Input
                    value={lessonForm.titleUz}
                    onChange={(e) => updateLessonField('titleUz', e.target.value)}
                    placeholder="Дарс номи (кирилл)"
                  />
                </TabsContent>
                <TabsContent value="ru" className="mt-3">
                  <Input
                    value={lessonForm.titleRu}
                    onChange={(e) => updateLessonField('titleRu', e.target.value)}
                    placeholder="Название урока"
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Description */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{ts('admin.plans.descSection')}</p>
              <Tabs defaultValue="uzLatin">
                <TabsList className="w-full">
                  <TabsTrigger value="uzLatin" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzLatin')}</TabsTrigger>
                  <TabsTrigger value="uz" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzCyrillic')}</TabsTrigger>
                  <TabsTrigger value="ru" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langRussian')}</TabsTrigger>
                </TabsList>
                <TabsContent value="uzLatin" className="mt-3">
                  <Textarea
                    value={lessonForm.descriptionUzLatin}
                    onChange={(e) => updateLessonField('descriptionUzLatin', e.target.value)}
                    placeholder="Tavsif (lotin)"
                    rows={3}
                  />
                </TabsContent>
                <TabsContent value="uz" className="mt-3">
                  <Textarea
                    value={lessonForm.descriptionUz}
                    onChange={(e) => updateLessonField('descriptionUz', e.target.value)}
                    placeholder="Тавсиф (кирилл)"
                    rows={3}
                  />
                </TabsContent>
                <TabsContent value="ru" className="mt-3">
                  <Textarea
                    value={lessonForm.descriptionRu}
                    onChange={(e) => updateLessonField('descriptionRu', e.target.value)}
                    placeholder="Описание"
                    rows={3}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Category + Sort + Duration */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>{ts('admin.videoLessons.category')}</Label>
                <Select value={lessonForm.videoCategoryId} onValueChange={(v) => updateLessonField('videoCategoryId', v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder={ts('admin.videoLessons.category')}>
                      {lessonForm.videoCategoryId ? getText(categories.find(c => c.id === lessonForm.videoCategoryId)?.name) || ts('admin.videoLessons.category') : ts('admin.videoLessons.category')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {getText(cat.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{ts('admin.videoLessons.duration')}</Label>
                <Input
                  value={lessonForm.duration}
                  onChange={(e) => updateLessonField('duration', e.target.value)}
                  placeholder="MM:SS"
                />
              </div>
              <div>
                <Label>{ts('admin.categories.sortOrder')}</Label>
                <Input
                  type="number"
                  min="0"
                  value={lessonForm.sortOrder}
                  onChange={(e) => updateLessonField('sortOrder', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Source Type */}
            <div>
              <Label className="mb-2 block">{ts('admin.videoLessons.sourceType')}</Label>
              <div className="flex gap-2">
                {SOURCE_TYPES.map((st) => (
                  <Button
                    key={st.value}
                    type="button"
                    variant={lessonForm.sourceType === st.value ? 'default' : 'outline'}
                    size="sm"
                    className={lessonForm.sourceType === st.value ? 'bg-[oklch(0.588_0.158_241)] text-white' : ''}
                    onClick={() => updateLessonField('sourceType', st.value)}
                  >
                    {ts(st.labelKey)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Video Source Inputs */}
            {lessonForm.sourceType === 'upload' && (
              <div>
                <Label className="mb-2 block">{ts('admin.videoLessons.uploadVideo')}</Label>
                <input
                  ref={videoFileRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={onVideoSelected}
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => videoFileRef.current?.click()}
                    disabled={uploadingVideo}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {ts('admin.videoLessons.uploadVideo')}
                  </Button>
                  {selectedVideo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{selectedVideo.name}</span>
                      <span className="text-xs">({formatFileSize(selectedVideo.size)})</span>
                      <Button variant="ghost" size="icon-sm" onClick={() => setSelectedVideo(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {lessonForm.sourceType === 'youTube' && (
              <div>
                <Label>{ts('admin.videoLessons.youtubeUrl')}</Label>
                <Input
                  value={lessonForm.videoUrl}
                  onChange={(e) => updateLessonField('videoUrl', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            )}

            {lessonForm.sourceType === 'externalLink' && (
              <div>
                <Label>{ts('admin.videoLessons.videoUrl')}</Label>
                <Input
                  value={lessonForm.videoUrl}
                  onChange={(e) => updateLessonField('videoUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}

            {lessonForm.sourceType === 'presentation' && (
              <div>
                <Label className="mb-2 block">{ts('admin.videoLessons.uploadPdf')}</Label>
                <input
                  ref={pdfFileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={onVideoSelected}
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => pdfFileRef.current?.click()}
                    disabled={uploadingVideo}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {ts('admin.videoLessons.uploadPdf')}
                  </Button>
                  {selectedVideo && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{selectedVideo.name}</span>
                      <span className="text-xs">({formatFileSize(selectedVideo.size)})</span>
                      <Button variant="ghost" size="icon-sm" onClick={() => setSelectedVideo(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Linked Category */}
            <div>
              <Label className="mb-1 block">{ts('admin.videoLessons.linkedCategory')}</Label>
              <p className="text-xs text-muted-foreground mb-2">{ts('admin.videoLessons.linkedCategoryDesc')}</p>
              <Select value={lessonForm.linkedCategoryId || '__none__'} onValueChange={(v) => updateLessonField('linkedCategoryId', !v || v === '__none__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder={ts('admin.videoLessons.noLinkedCategory')}>
                    {lessonForm.linkedCategoryId
                      ? getText(questionCategories.find(c => c.id === lessonForm.linkedCategoryId)?.name) || ts('admin.videoLessons.linkedCategory')
                      : ts('admin.videoLessons.noLinkedCategory')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{ts('admin.videoLessons.noLinkedCategory')}</SelectItem>
                  {questionCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {getText(cat.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Thumbnail */}
            <div>
              <Label className="mb-2 block">{ts('admin.videoLessons.thumbnail')}</Label>
              <input
                ref={thumbnailFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onThumbnailSelected}
              />
              <div className="flex items-center gap-3">
                {thumbnailPreview && (
                  <img src={thumbnailPreview} alt="" className="h-16 w-28 rounded object-cover" />
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => thumbnailFileRef.current?.click()}
                  disabled={uploadingThumbnail}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {ts('admin.videoLessons.uploadThumbnail')}
                </Button>
                {selectedThumbnail && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{selectedThumbnail.name}</span>
                    <Button variant="ghost" size="icon-sm" onClick={() => { setSelectedThumbnail(null); setThumbnailPreview(editingLesson?.thumbnailUrl ?? null); }}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Free / Active toggles */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={lessonForm.isFree}
                  onCheckedChange={(checked) => updateLessonField('isFree', checked)}
                />
                <Label>{ts('admin.videoLessons.isFree')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={lessonForm.isDownloadable}
                  onCheckedChange={(checked) => updateLessonField('isDownloadable', checked)}
                />
                <Label>{ts('admin.videoLessons.isDownloadable')}</Label>
              </div>
              {editingLesson && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={lessonForm.isActive}
                    onCheckedChange={(checked) => updateLessonField('isActive', checked)}
                  />
                  <Label>{ts('admin.activeState')}</Label>
                </div>
              )}
            </div>

            {/* Attachments (only for editing) */}
            {editingLesson && (
              <div>
                <Label className="mb-2 block">{ts('admin.videoLessons.attachments')}</Label>
                <input
                  ref={attachmentFileRef}
                  type="file"
                  className="hidden"
                  onChange={handleAttachmentUpload}
                />
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm flex-1 truncate">{att.fileName}</span>
                      <span className="text-xs text-muted-foreground">{formatFileSize(att.fileSizeBytes)}</span>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleRemoveAttachment(att.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => attachmentFileRef.current?.click()}
                    disabled={uploadingAttachment}
                  >
                    <Paperclip className="h-4 w-4 mr-1" />
                    {ts('admin.videoLessons.uploadAttachment')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)} disabled={lessonSubmitting}>
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleLessonSubmit} disabled={lessonSubmitting || uploadingVideo || uploadingThumbnail} className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white">
              {lessonSubmitting
                ? ts('admin.saving')
                : editingLesson
                  ? ts('admin.saveBtn')
                  : ts('admin.createBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Lesson Delete Dialog ── */}
      <Dialog open={deleteLessonDialogOpen} onOpenChange={setDeleteLessonDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{ts('admin.videoLessons.deleteLessonTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {ts('admin.videoLessons.deleteLessonConfirm')}
            {deletingLesson && (
              <span className="font-medium text-foreground"> {getText(deletingLesson.title)}</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteLessonDialogOpen(false)} disabled={deletingLessonLoading}>
              {ts('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteLesson} disabled={deletingLessonLoading}>
              {deletingLessonLoading ? ts('admin.videoLessons.deleting') : ts('admin.videoLessons.deleteBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
