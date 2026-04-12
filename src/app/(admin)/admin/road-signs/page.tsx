'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import type { RoadSignCategoryDto, RoadSignDto, LocalizedText } from '@/types/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Pencil, Trash2, SignpostBig, ImageIcon, Upload, X } from 'lucide-react';
import { useLocaleStore } from '@/stores/locale-store';
import { useLocale } from '@/hooks/use-locale';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Category Form ──
interface CategoryFormData {
  slug: string;
  code: string;
  nameUz: string;
  nameUzLatin: string;
  nameRu: string;
  descriptionUz: string;
  descriptionUzLatin: string;
  descriptionRu: string;
  iconUrl: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyCategoryForm: CategoryFormData = {
  slug: '',
  code: '',
  nameUz: '',
  nameUzLatin: '',
  nameRu: '',
  descriptionUz: '',
  descriptionUzLatin: '',
  descriptionRu: '',
  iconUrl: '',
  sortOrder: '0',
  isActive: true,
};

function formFromCategory(cat: RoadSignCategoryDto): CategoryFormData {
  return {
    slug: cat.slug,
    code: cat.code,
    nameUz: cat.name.uz,
    nameUzLatin: cat.name.uzLatin,
    nameRu: cat.name.ru,
    descriptionUz: cat.description.uz,
    descriptionUzLatin: cat.description.uzLatin,
    descriptionRu: cat.description.ru,
    iconUrl: cat.iconUrl ?? '',
    sortOrder: String(cat.sortOrder),
    isActive: cat.isActive,
  };
}

// ── Sign Form ──
interface SignFormData {
  signCode: string;
  nameUz: string;
  nameUzLatin: string;
  nameRu: string;
  descriptionUz: string;
  descriptionUzLatin: string;
  descriptionRu: string;
  sortOrder: string;
  isActive: boolean;
  categoryId: string;
}

const emptySignForm: SignFormData = {
  signCode: '',
  nameUz: '',
  nameUzLatin: '',
  nameRu: '',
  descriptionUz: '',
  descriptionUzLatin: '',
  descriptionRu: '',
  sortOrder: '0',
  isActive: true,
  categoryId: '',
};

function formFromSign(sign: RoadSignDto): SignFormData {
  return {
    signCode: sign.signCode,
    nameUz: sign.name.uz,
    nameUzLatin: sign.name.uzLatin,
    nameRu: sign.name.ru,
    descriptionUz: sign.description?.uz ?? '',
    descriptionUzLatin: sign.description?.uzLatin ?? '',
    descriptionRu: sign.description?.ru ?? '',
    sortOrder: String(sign.sortOrder),
    isActive: sign.isActive,
    categoryId: sign.categoryId,
  };
}

export default function RoadSignsPage() {
  const { language } = useLocaleStore();
  const { t, ts } = useLocale();
  const lang = language as keyof LocalizedText;

  const [activeTab, setActiveTab] = useState('categories');

  // ── Categories State ──
  const [categories, setCategories] = useState<RoadSignCategoryDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RoadSignCategoryDto | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(emptyCategoryForm);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryAutoSlug, setCategoryAutoSlug] = useState(true);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<RoadSignCategoryDto | null>(null);
  const [deletingCategoryLoading, setDeletingCategoryLoading] = useState(false);

  // ── Signs State ──
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [signs, setSigns] = useState<RoadSignDto[]>([]);
  const [loadingSigns, setLoadingSigns] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [editingSign, setEditingSign] = useState<RoadSignDto | null>(null);
  const [signForm, setSignForm] = useState<SignFormData>(emptySignForm);
  const [signSubmitting, setSignSubmitting] = useState(false);
  const [deleteSignDialogOpen, setDeleteSignDialogOpen] = useState(false);
  const [deletingSign, setDeletingSign] = useState<RoadSignDto | null>(null);
  const [deletingSignLoading, setDeletingSignLoading] = useState(false);

  // ── Image Upload ──
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const dialogFileRef = useRef<HTMLInputElement>(null);

  const getText = (text: LocalizedText) => text[lang] || text.uzLatin;

  // ── Fetch Categories ──
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const data = await apiClient.get<RoadSignCategoryDto[]>('/road-signs/categories');
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

  // ── Fetch Signs ──
  const fetchSigns = useCallback(async () => {
    setLoadingSigns(true);
    try {
      const query = filterCategoryId && filterCategoryId !== 'all' ? `?categoryId=${filterCategoryId}` : '';
      const data = await apiClient.get<RoadSignDto[]>(`/admin/road-signs${query}`);
      setSigns(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLoadingSigns(false);
    }
  }, [filterCategoryId]);

  useEffect(() => {
    if (activeTab === 'signs')
      fetchSigns();
  }, [activeTab, fetchSigns]);

  // ── Category CRUD ──
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
    setCategoryAutoSlug(true);
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (cat: RoadSignCategoryDto) => {
    setEditingCategory(cat);
    setCategoryForm(formFromCategory(cat));
    setCategoryAutoSlug(false);
    setCategoryDialogOpen(true);
  };

  const openDeleteCategory = (cat: RoadSignCategoryDto) => {
    setDeletingCategory(cat);
    setDeleteCategoryDialogOpen(true);
  };

  const updateCategoryField = <K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) => {
    setCategoryForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'nameUzLatin' && categoryAutoSlug)
        next.slug = slugify(value as string);
      return next;
    });
  };

  const handleCategorySubmit = async () => {
    if (!categoryForm.nameUzLatin.trim()) {
      toast.error(ts('admin.roadSigns.categoryNameRequired'));
      return;
    }
    if (!categoryForm.code.trim()) {
      toast.error(ts('admin.roadSigns.categoryCodeRequired'));
      return;
    }
    if (!categoryForm.slug.trim()) {
      toast.error(ts('admin.roadSigns.categorySlugRequired'));
      return;
    }

    setCategorySubmitting(true);
    try {
      const payload = {
        slug: categoryForm.slug,
        code: categoryForm.code,
        name: { uz: categoryForm.nameUz, uzLatin: categoryForm.nameUzLatin, ru: categoryForm.nameRu },
        description: { uz: categoryForm.descriptionUz, uzLatin: categoryForm.descriptionUzLatin, ru: categoryForm.descriptionRu },
        iconUrl: categoryForm.iconUrl || null,
        sortOrder: Number(categoryForm.sortOrder) || 0,
        isActive: categoryForm.isActive,
      };

      if (editingCategory) {
        await apiClient.put(`/admin/road-signs/categories/${editingCategory.id}`, payload);
        toast.success(ts('admin.roadSigns.categoryUpdated'));
      } else {
        await apiClient.post('/admin/road-signs/categories', payload);
        toast.success(ts('admin.roadSigns.categoryCreated'));
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
      await apiClient.delete(`/admin/road-signs/categories/${deletingCategory.id}`);
      toast.success(ts('admin.roadSigns.categoryDeleted'));
      setDeleteCategoryDialogOpen(false);
      setDeletingCategory(null);
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setDeletingCategoryLoading(false);
    }
  };

  // ── Sign CRUD ──
  const openCreateSign = () => {
    setEditingSign(null);
    setSignForm({ ...emptySignForm, categoryId: filterCategoryId !== 'all' ? filterCategoryId : '' });
    setSelectedImage(null);
    setImagePreview(null);
    setSignDialogOpen(true);
  };

  const openEditSign = (sign: RoadSignDto) => {
    setEditingSign(sign);
    setSignForm(formFromSign(sign));
    setSelectedImage(null);
    setImagePreview(sign.thumbnailUrl || sign.imageUrl);
    setSignDialogOpen(true);
  };

  const openDeleteSign = (sign: RoadSignDto) => {
    setDeletingSign(sign);
    setDeleteSignDialogOpen(true);
  };

  const updateSignField = <K extends keyof SignFormData>(key: K, value: SignFormData[K]) => {
    setSignForm((prev) => ({ ...prev, [key]: value }));
  };

  const onDialogFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (editingSign)
      setImagePreview(editingSign.thumbnailUrl || editingSign.imageUrl);
    else
      setImagePreview(null);
  };

  const uploadImage = async (signId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/road-signs/${signId}/image`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      }
    );

    if (!response.ok) throw new Error('Upload failed');
  };

  const handleSignSubmit = async () => {
    if (!signForm.nameUzLatin.trim()) {
      toast.error(ts('admin.roadSigns.signNameRequired'));
      return;
    }
    if (!signForm.signCode.trim()) {
      toast.error(ts('admin.roadSigns.signCodeRequired'));
      return;
    }
    if (!signForm.categoryId) {
      toast.error(ts('admin.roadSigns.categoryRequired'));
      return;
    }

    setSignSubmitting(true);
    try {
      const payload = {
        signCode: signForm.signCode,
        name: { uz: signForm.nameUz, uzLatin: signForm.nameUzLatin, ru: signForm.nameRu },
        description: signForm.descriptionUzLatin.trim()
          ? { uz: signForm.descriptionUz, uzLatin: signForm.descriptionUzLatin, ru: signForm.descriptionRu }
          : null,
        sortOrder: Number(signForm.sortOrder) || 0,
        isActive: signForm.isActive,
        categoryId: signForm.categoryId,
      };

      let signId: string;

      if (editingSign) {
        await apiClient.put(`/admin/road-signs/${editingSign.id}`, payload);
        signId = editingSign.id;
        toast.success(ts('admin.roadSigns.signUpdated'));
      } else {
        const id = await apiClient.post<string>('/admin/road-signs', payload);
        signId = id;
        toast.success(ts('admin.roadSigns.signCreated'));
      }

      if (selectedImage)
        await uploadImage(signId, selectedImage);

      setSignDialogOpen(false);
      setSelectedImage(null);
      setImagePreview(null);
      fetchSigns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setSignSubmitting(false);
    }
  };

  const handleDeleteSign = async () => {
    if (!deletingSign) return;
    setDeletingSignLoading(true);
    try {
      await apiClient.delete(`/admin/road-signs/${deletingSign.id}`);
      toast.success(ts('admin.roadSigns.signDeleted'));
      setDeleteSignDialogOpen(false);
      setDeletingSign(null);
      fetchSigns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setDeletingSignLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? getText(cat.name) : '--';
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">{ts('admin.navRoadSigns')}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v ?? 'categories')}>
        <TabsList>
          <TabsTrigger value="categories" className="data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.roadSigns.categoriesTab')}</TabsTrigger>
          <TabsTrigger value="signs" className="data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.roadSigns.signsTab')}</TabsTrigger>
        </TabsList>

        {/* ── Categories Tab ── */}
        <TabsContent value="categories" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {ts('common.total')}: {categories.length}
            </p>
            <Button className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white" onClick={openCreateCategory}>
              <Plus className="h-4 w-4" />
              {ts('admin.roadSigns.addCategory')}
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
                <SignpostBig className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-1">{ts('admin.roadSigns.noCategories')}</p>
                <p className="text-sm text-muted-foreground mb-4">{ts('admin.roadSigns.createCategoryFirst')}</p>
                <Button onClick={openCreateCategory}>
                  <Plus className="h-4 w-4" />
                  {ts('admin.roadSigns.addCategory')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-24">
                      {ts('admin.roadSigns.categoryCode')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {ts('admin.plans.nameSection')}
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-24">
                      {ts('admin.roadSigns.signCount')}
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">
                      {ts('admin.categories.sortOrder')}
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-24">
                      {ts('admin.fines.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} className="border-b last:border-b-0 hover:bg-white/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{cat.code}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">{getText(cat.name)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                          {cat.signCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-muted-foreground font-mono">#{cat.sortOrder}</span>
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

        {/* ── Signs Tab ── */}
        <TabsContent value="signs" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Select value={filterCategoryId} onValueChange={(v) => setFilterCategoryId(v ?? 'all')}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder={ts('admin.roadSigns.allCategories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{ts('admin.roadSigns.allCategories')}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.code} - {getText(cat.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white" onClick={openCreateSign}>
              <Plus className="h-4 w-4" />
              {ts('admin.roadSigns.addSign')}
            </Button>
          </div>

          {loadingSigns ? (
            <div className="rounded-lg border">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
                  <Skeleton className="h-10 w-10 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : !signs.length ? (
            <Card>
              <CardContent className="py-16 text-center">
                <SignpostBig className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-1">{ts('admin.roadSigns.noSigns')}</p>
                <p className="text-sm text-muted-foreground mb-4">{ts('admin.roadSigns.createSignFirst')}</p>
                <Button onClick={openCreateSign}>
                  <Plus className="h-4 w-4" />
                  {ts('admin.roadSigns.addSign')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-16">
                      {ts('admin.roadSigns.image')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-24">
                      {ts('admin.roadSigns.signCode')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {ts('admin.plans.nameSection')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-36">
                      {ts('admin.roadSigns.category')}
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
                  {signs.map((sign) => (
                    <tr key={sign.id} className="border-b last:border-b-0 hover:bg-white/30 transition-colors">
                      <td className="px-4 py-3">
                        {sign.thumbnailUrl || sign.imageUrl ? (
                          <img
                            src={sign.thumbnailUrl || sign.imageUrl!}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">{sign.signCode}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{getText(sign.name)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">{getCategoryName(sign.categoryId)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={sign.isActive ? 'default' : 'secondary'} className="text-xs">
                          {sign.isActive ? ts('admin.roadSigns.active') : ts('admin.roadSigns.inactive')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEditSign(sign)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => openDeleteSign(sign)}>
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
              {editingCategory ? ts('admin.roadSigns.editCategoryTitle') : ts('admin.roadSigns.createCategoryTitle')}
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
                <Label htmlFor="catCode">{ts('admin.roadSigns.categoryCode')}</Label>
                <Input
                  id="catCode"
                  value={categoryForm.code}
                  onChange={(e) => updateCategoryField('code', e.target.value)}
                  placeholder="1, 2, 3..."
                />
              </div>
              <div>
                <Label htmlFor="catSlug">{ts('admin.categories.slug')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="catSlug"
                    value={categoryForm.slug}
                    onChange={(e) => {
                      setCategoryAutoSlug(false);
                      updateCategoryField('slug', e.target.value);
                    }}
                    placeholder="category-slug"
                    className="flex-1"
                  />
                  {!categoryAutoSlug && !editingCategory && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCategoryAutoSlug(true);
                        setCategoryForm((prev) => ({ ...prev, slug: slugify(prev.nameUzLatin) }));
                      }}
                    >
                      {ts('admin.categories.autoSlug')}
                    </Button>
                  )}
                </div>
              </div>
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
              <div>
                <Label htmlFor="catIconUrl">Icon URL</Label>
                <Input
                  id="catIconUrl"
                  value={categoryForm.iconUrl}
                  onChange={(e) => updateCategoryField('iconUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
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
            <DialogTitle>{ts('admin.roadSigns.deleteCategoryTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {ts('admin.roadSigns.deleteCategoryConfirm')}
            {deletingCategory && (
              <span className="font-medium text-foreground"> {getText(deletingCategory.name)}</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategoryDialogOpen(false)} disabled={deletingCategoryLoading}>
              {ts('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={deletingCategoryLoading}>
              {deletingCategoryLoading ? ts('admin.roadSigns.deleting') : ts('admin.roadSigns.deleteBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sign Create/Edit Dialog ── */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSign ? ts('admin.roadSigns.editSignTitle') : ts('admin.roadSigns.createSignTitle')}
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
                    value={signForm.nameUzLatin}
                    onChange={(e) => updateSignField('nameUzLatin', e.target.value)}
                    placeholder="Belgi nomi (lotin)"
                  />
                </TabsContent>
                <TabsContent value="uz" className="mt-3">
                  <Input
                    value={signForm.nameUz}
                    onChange={(e) => updateSignField('nameUz', e.target.value)}
                    placeholder="Белги номи (кирилл)"
                  />
                </TabsContent>
                <TabsContent value="ru" className="mt-3">
                  <Input
                    value={signForm.nameRu}
                    onChange={(e) => updateSignField('nameRu', e.target.value)}
                    placeholder="Название знака"
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
                    value={signForm.descriptionUzLatin}
                    onChange={(e) => updateSignField('descriptionUzLatin', e.target.value)}
                    placeholder="Tavsif (lotin)"
                    rows={3}
                  />
                </TabsContent>
                <TabsContent value="uz" className="mt-3">
                  <Textarea
                    value={signForm.descriptionUz}
                    onChange={(e) => updateSignField('descriptionUz', e.target.value)}
                    placeholder="Тавсиф (кирилл)"
                    rows={3}
                  />
                </TabsContent>
                <TabsContent value="ru" className="mt-3">
                  <Textarea
                    value={signForm.descriptionRu}
                    onChange={(e) => updateSignField('descriptionRu', e.target.value)}
                    placeholder="Описание"
                    rows={3}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="signCode">{ts('admin.roadSigns.signCode')}</Label>
                <Input
                  id="signCode"
                  value={signForm.signCode}
                  onChange={(e) => updateSignField('signCode', e.target.value)}
                  placeholder="1.1, 2.3.1, etc."
                />
              </div>
              <div>
                <Label htmlFor="signCategory">{ts('admin.roadSigns.category')}</Label>
                <Select value={signForm.categoryId} onValueChange={(v) => updateSignField('categoryId', v ?? '')}>
                  <SelectTrigger id="signCategory">
                    <SelectValue placeholder={ts('admin.roadSigns.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.code} - {getText(cat.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="signSortOrder">{ts('admin.categories.sortOrder')}</Label>
                <Input
                  id="signSortOrder"
                  type="number"
                  min="0"
                  value={signForm.sortOrder}
                  onChange={(e) => updateSignField('sortOrder', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <Label>{ts('admin.roadSigns.image')}</Label>
              <input
                ref={dialogFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onDialogFileSelected}
              />
              {imagePreview ? (
                <div className="relative mt-2 inline-block">
                  <img src={imagePreview} alt="" className="h-32 w-32 rounded-lg object-cover border" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive text-white p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => dialogFileRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {ts('admin.roadSigns.uploadImage')}
                </Button>
              )}
              {imagePreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 ml-2"
                  onClick={() => dialogFileRef.current?.click()}
                >
                  {ts('admin.roadSigns.changeImage')}
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSignDialogOpen(false)} disabled={signSubmitting}>
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleSignSubmit} disabled={signSubmitting} className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white">
              {signSubmitting
                ? ts('admin.saving')
                : editingSign
                  ? ts('admin.saveBtn')
                  : ts('admin.createBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sign Delete Dialog ── */}
      <Dialog open={deleteSignDialogOpen} onOpenChange={setDeleteSignDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{ts('admin.roadSigns.deleteSignTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {ts('admin.roadSigns.deleteSignConfirm')}
            {deletingSign && (
              <span className="font-medium text-foreground"> {getText(deletingSign.name)}</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSignDialogOpen(false)} disabled={deletingSignLoading}>
              {ts('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteSign} disabled={deletingSignLoading}>
              {deletingSignLoading ? ts('admin.roadSigns.deleting') : ts('admin.roadSigns.deleteBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
