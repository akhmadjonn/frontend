'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { GlossaryCategoryDto, GlossaryTermDto, LocalizedText } from '@/types/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Plus, Pencil, Trash2, BookOpen, Tags } from 'lucide-react';
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
  nameUz: string;
  nameUzLatin: string;
  nameRu: string;
  icon: string;
  sortOrder: string;
}

const emptyCategoryForm: CategoryFormData = {
  slug: '',
  nameUz: '',
  nameUzLatin: '',
  nameRu: '',
  icon: '',
  sortOrder: '0',
};

function formFromCategory(cat: GlossaryCategoryDto): CategoryFormData {
  return {
    slug: cat.slug,
    nameUz: cat.name.uz,
    nameUzLatin: cat.name.uzLatin,
    nameRu: cat.name.ru,
    icon: cat.icon ?? '',
    sortOrder: String(cat.sortOrder),
  };
}

// ── Term Form ──
interface TermFormData {
  termUz: string;
  termUzLatin: string;
  termRu: string;
  definitionUz: string;
  definitionUzLatin: string;
  definitionRu: string;
  sortOrder: string;
  categoryId: string;
}

const emptyTermForm: TermFormData = {
  termUz: '',
  termUzLatin: '',
  termRu: '',
  definitionUz: '',
  definitionUzLatin: '',
  definitionRu: '',
  sortOrder: '0',
  categoryId: '',
};

function formFromTerm(term: GlossaryTermDto, categoryId: string): TermFormData {
  return {
    termUz: term.term.uz,
    termUzLatin: term.term.uzLatin,
    termRu: term.term.ru,
    definitionUz: term.definition.uz,
    definitionUzLatin: term.definition.uzLatin,
    definitionRu: term.definition.ru,
    sortOrder: String(term.sortOrder),
    categoryId,
  };
}

export default function GlossaryPage() {
  const { language } = useLocaleStore();
  const { t, ts } = useLocale();
  const lang = language as keyof LocalizedText;

  const [activeTab, setActiveTab] = useState('categories');

  // ── Categories State ──
  const [categories, setCategories] = useState<GlossaryCategoryDto[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GlossaryCategoryDto | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>(emptyCategoryForm);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryAutoSlug, setCategoryAutoSlug] = useState(true);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<GlossaryCategoryDto | null>(null);
  const [deletingCategoryLoading, setDeletingCategoryLoading] = useState(false);

  // ── Terms State ──
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('');
  const [terms, setTerms] = useState<GlossaryTermDto[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<GlossaryTermDto | null>(null);
  const [termForm, setTermForm] = useState<TermFormData>(emptyTermForm);
  const [termSubmitting, setTermSubmitting] = useState(false);
  const [deleteTermDialogOpen, setDeleteTermDialogOpen] = useState(false);
  const [deletingTerm, setDeletingTerm] = useState<GlossaryTermDto | null>(null);
  const [deletingTermLoading, setDeletingTermLoading] = useState(false);

  const getText = (text: LocalizedText) => text[lang] || text.uzLatin;

  // ── Fetch Categories ──
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const data = await apiClient.get<GlossaryCategoryDto[]>('/glossary/categories');
      setCategories(data);
      if (!selectedCategorySlug && data.length > 0)
        setSelectedCategorySlug(data[0].slug);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ── Fetch Terms ──
  const fetchTerms = useCallback(async () => {
    if (!selectedCategorySlug) return;
    setLoadingTerms(true);
    try {
      const data = await apiClient.get<GlossaryTermDto[]>(
        `/glossary/categories/${selectedCategorySlug}/terms`
      );
      setTerms(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setLoadingTerms(false);
    }
  }, [selectedCategorySlug]);

  useEffect(() => {
    if (activeTab === 'terms' && selectedCategorySlug)
      fetchTerms();
  }, [activeTab, fetchTerms, selectedCategorySlug]);

  // ── Category CRUD ──
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
    setCategoryAutoSlug(true);
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (cat: GlossaryCategoryDto) => {
    setEditingCategory(cat);
    setCategoryForm(formFromCategory(cat));
    setCategoryAutoSlug(false);
    setCategoryDialogOpen(true);
  };

  const openDeleteCategory = (cat: GlossaryCategoryDto) => {
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
      toast.error(ts('admin.glossary.categoryNameRequired'));
      return;
    }
    if (!categoryForm.slug.trim()) {
      toast.error(ts('admin.glossary.categorySlugRequired'));
      return;
    }

    setCategorySubmitting(true);
    try {
      const payload = {
        slug: categoryForm.slug,
        name: { uz: categoryForm.nameUz, uzLatin: categoryForm.nameUzLatin, ru: categoryForm.nameRu },
        icon: categoryForm.icon || null,
        sortOrder: Number(categoryForm.sortOrder) || 0,
      };

      if (editingCategory) {
        await apiClient.put(`/admin/glossary/categories/${editingCategory.id}`, payload);
        toast.success(ts('admin.glossary.categoryUpdated'));
      } else {
        await apiClient.post('/admin/glossary/categories', payload);
        toast.success(ts('admin.glossary.categoryCreated'));
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
      await apiClient.delete(`/admin/glossary/categories/${deletingCategory.id}`);
      toast.success(ts('admin.glossary.categoryDeleted'));
      setDeleteCategoryDialogOpen(false);
      setDeletingCategory(null);
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setDeletingCategoryLoading(false);
    }
  };

  // ── Term CRUD ──
  const openCreateTerm = () => {
    const selectedCategory = categories.find((c) => c.slug === selectedCategorySlug);
    setEditingTerm(null);
    setTermForm({ ...emptyTermForm, categoryId: selectedCategory?.id ?? '' });
    setTermDialogOpen(true);
  };

  const openEditTerm = (term: GlossaryTermDto) => {
    const selectedCategory = categories.find((c) => c.slug === selectedCategorySlug);
    setEditingTerm(term);
    setTermForm(formFromTerm(term, selectedCategory?.id ?? ''));
    setTermDialogOpen(true);
  };

  const openDeleteTerm = (term: GlossaryTermDto) => {
    setDeletingTerm(term);
    setDeleteTermDialogOpen(true);
  };

  const updateTermField = <K extends keyof TermFormData>(key: K, value: TermFormData[K]) => {
    setTermForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTermSubmit = async () => {
    if (!termForm.termUzLatin.trim()) {
      toast.error(ts('admin.glossary.termRequired'));
      return;
    }
    if (!termForm.definitionUzLatin.trim()) {
      toast.error(ts('admin.glossary.definitionRequired'));
      return;
    }
    if (!termForm.categoryId) {
      toast.error(ts('admin.glossary.categoryRequired'));
      return;
    }

    setTermSubmitting(true);
    try {
      const payload = {
        term: { uz: termForm.termUz, uzLatin: termForm.termUzLatin, ru: termForm.termRu },
        definition: { uz: termForm.definitionUz, uzLatin: termForm.definitionUzLatin, ru: termForm.definitionRu },
        sortOrder: Number(termForm.sortOrder) || 0,
        categoryId: termForm.categoryId,
      };

      if (editingTerm) {
        await apiClient.put(`/admin/glossary/terms/${editingTerm.id}`, payload);
        toast.success(ts('admin.glossary.termUpdated'));
      } else {
        await apiClient.post('/admin/glossary/terms', payload);
        toast.success(ts('admin.glossary.termCreated'));
      }

      setTermDialogOpen(false);
      fetchTerms();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setTermSubmitting(false);
    }
  };

  const handleDeleteTerm = async () => {
    if (!deletingTerm) return;
    setDeletingTermLoading(true);
    try {
      await apiClient.delete(`/admin/glossary/terms/${deletingTerm.id}`);
      toast.success(ts('admin.glossary.termDeleted'));
      setDeleteTermDialogOpen(false);
      setDeletingTerm(null);
      fetchTerms();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ts('common.error'));
    } finally {
      setDeletingTermLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">{ts('admin.navGlossary')}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="categories" className="data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.glossary.categoriesTab')}</TabsTrigger>
          <TabsTrigger value="terms" className="data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.glossary.termsTab')}</TabsTrigger>
        </TabsList>

        {/* ── Categories Tab ── */}
        <TabsContent value="categories" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {ts('common.total')}: {categories.length}
            </p>
            <Button className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white" onClick={openCreateCategory}>
              <Plus className="h-4 w-4" />
              {ts('admin.glossary.addCategory')}
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
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-1">{ts('admin.glossary.noCategories')}</p>
                <p className="text-sm text-muted-foreground mb-4">{ts('admin.glossary.createCategoryFirst')}</p>
                <Button onClick={openCreateCategory}>
                  <Plus className="h-4 w-4" />
                  {ts('admin.glossary.addCategory')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-32">
                      {ts('admin.categories.slug')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {ts('admin.plans.nameSection')}
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">
                      {ts('admin.glossary.icon')}
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-24">
                      {ts('admin.glossary.termCount')}
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
                        <span className="font-mono text-xs text-muted-foreground">{cat.slug}</span>
                      </td>
                      <td className="px-4 py-3 font-medium">{getText(cat.name)}</td>
                      <td className="px-4 py-3 text-center">
                        {cat.icon ? (
                          <span className="text-lg">{cat.icon}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                          {cat.termCount}
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

        {/* ── Terms Tab ── */}
        <TabsContent value="terms" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-[200px]">
              <Select value={selectedCategorySlug} onValueChange={(val) => setSelectedCategorySlug(val ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={ts('admin.glossary.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {getText(cat.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white" onClick={openCreateTerm} disabled={!selectedCategorySlug}>
              <Plus className="h-4 w-4" />
              {ts('admin.glossary.addTerm')}
            </Button>
          </div>

          {!selectedCategorySlug ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Tags className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{ts('admin.glossary.selectCategoryHint')}</p>
              </CardContent>
            </Card>
          ) : loadingTerms ? (
            <div className="rounded-lg border">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : !terms.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Tags className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">{ts('admin.glossary.noTerms')}</p>
                <Button onClick={openCreateTerm}>
                  <Plus className="h-4 w-4" />
                  {ts('admin.glossary.addTerm')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {ts('admin.glossary.term')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      {ts('admin.glossary.definition')}
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
                  {terms.map((term) => (
                    <tr key={term.id} className="border-b last:border-b-0 hover:bg-white/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{getText(term.term)}</td>
                      <td className="px-4 py-3">
                        <span className="line-clamp-2 text-muted-foreground">
                          {getText(term.definition)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-muted-foreground font-mono">#{term.sortOrder}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEditTerm(term)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => openDeleteTerm(term)}>
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
              {editingCategory ? ts('admin.glossary.editCategoryTitle') : ts('admin.glossary.createCategoryTitle')}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="catIcon">{ts('admin.glossary.icon')}</Label>
                <Input
                  id="catIcon"
                  value={categoryForm.icon}
                  onChange={(e) => updateCategoryField('icon', e.target.value)}
                  placeholder="emoji or icon name"
                />
              </div>
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
            <DialogTitle>{ts('admin.glossary.deleteCategoryTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {ts('admin.glossary.deleteCategoryConfirm')}
            {deletingCategory && (
              <span className="font-medium text-foreground"> {getText(deletingCategory.name)}</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategoryDialogOpen(false)} disabled={deletingCategoryLoading}>
              {ts('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={deletingCategoryLoading}>
              {deletingCategoryLoading ? ts('admin.glossary.deleting') : ts('admin.glossary.deleteBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Term Create/Edit Dialog ── */}
      <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTerm ? ts('admin.glossary.editTermTitle') : ts('admin.glossary.createTermTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{ts('admin.glossary.categoryLabel')}</Label>
              <Select value={termForm.categoryId} onValueChange={(v) => updateTermField('categoryId', v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={ts('admin.glossary.selectCategory')} />
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
              <p className="text-sm font-medium text-muted-foreground mb-2">{ts('admin.glossary.term')}</p>
              <Tabs defaultValue="uzLatin">
                <TabsList className="w-full">
                  <TabsTrigger value="uzLatin" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzLatin')}</TabsTrigger>
                  <TabsTrigger value="uz" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzCyrillic')}</TabsTrigger>
                  <TabsTrigger value="ru" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langRussian')}</TabsTrigger>
                </TabsList>
                <TabsContent value="uzLatin" className="mt-3">
                  <Input
                    value={termForm.termUzLatin}
                    onChange={(e) => updateTermField('termUzLatin', e.target.value)}
                    placeholder="Atama (lotin)"
                  />
                </TabsContent>
                <TabsContent value="uz" className="mt-3">
                  <Input
                    value={termForm.termUz}
                    onChange={(e) => updateTermField('termUz', e.target.value)}
                    placeholder="Атама (кирилл)"
                  />
                </TabsContent>
                <TabsContent value="ru" className="mt-3">
                  <Input
                    value={termForm.termRu}
                    onChange={(e) => updateTermField('termRu', e.target.value)}
                    placeholder="Термин"
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">{ts('admin.glossary.definition')}</p>
              <Tabs defaultValue="uzLatin">
                <TabsList className="w-full">
                  <TabsTrigger value="uzLatin" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzLatin')}</TabsTrigger>
                  <TabsTrigger value="uz" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langUzCyrillic')}</TabsTrigger>
                  <TabsTrigger value="ru" className="flex-1 data-[state=active]:bg-[oklch(0.588_0.158_241)] data-[state=active]:text-white">{ts('admin.langRussian')}</TabsTrigger>
                </TabsList>
                <TabsContent value="uzLatin" className="mt-3">
                  <Textarea
                    value={termForm.definitionUzLatin}
                    onChange={(e) => updateTermField('definitionUzLatin', e.target.value)}
                    placeholder="Ta'rif (lotin)"
                    rows={3}
                  />
                </TabsContent>
                <TabsContent value="uz" className="mt-3">
                  <Textarea
                    value={termForm.definitionUz}
                    onChange={(e) => updateTermField('definitionUz', e.target.value)}
                    placeholder="Таъриф (кирилл)"
                    rows={3}
                  />
                </TabsContent>
                <TabsContent value="ru" className="mt-3">
                  <Textarea
                    value={termForm.definitionRu}
                    onChange={(e) => updateTermField('definitionRu', e.target.value)}
                    placeholder="Определение"
                    rows={3}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <Label htmlFor="termSortOrder">{ts('admin.categories.sortOrder')}</Label>
              <Input
                id="termSortOrder"
                type="number"
                min="0"
                value={termForm.sortOrder}
                onChange={(e) => updateTermField('sortOrder', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTermDialogOpen(false)} disabled={termSubmitting}>
              {ts('common.cancel')}
            </Button>
            <Button onClick={handleTermSubmit} disabled={termSubmitting} className="rounded-xl bg-[oklch(0.588_0.158_241)] hover:bg-[oklch(0.52_0.158_241)] text-white">
              {termSubmitting
                ? ts('admin.saving')
                : editingTerm
                  ? ts('admin.saveBtn')
                  : ts('admin.createBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Term Delete Dialog ── */}
      <Dialog open={deleteTermDialogOpen} onOpenChange={setDeleteTermDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{ts('admin.glossary.deleteTermTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {ts('admin.glossary.deleteTermConfirm')}
            {deletingTerm && (
              <span className="font-medium text-foreground"> {getText(deletingTerm.term)}</span>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTermDialogOpen(false)} disabled={deletingTermLoading}>
              {ts('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteTerm} disabled={deletingTermLoading}>
              {deletingTermLoading ? ts('admin.glossary.deleting') : ts('admin.glossary.deleteBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
