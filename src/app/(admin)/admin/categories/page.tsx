'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import type { CategoryDto, LocalizedText } from '@/types/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  FolderTree,
  ChevronRight,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { useLocaleStore } from '@/stores/locale-store';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface CategoryFormData {
  nameUz: string;
  nameUzLatin: string;
  nameRu: string;
  descriptionUz: string;
  descriptionUzLatin: string;
  descriptionRu: string;
  slug: string;
  iconUrl: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyForm: CategoryFormData = {
  nameUz: '',
  nameUzLatin: '',
  nameRu: '',
  descriptionUz: '',
  descriptionUzLatin: '',
  descriptionRu: '',
  slug: '',
  iconUrl: '',
  parentId: '',
  sortOrder: '0',
  isActive: true,
};

function formFromCategory(cat: CategoryDto): CategoryFormData {
  return {
    nameUz: cat.name.uz,
    nameUzLatin: cat.name.uzLatin,
    nameRu: cat.name.ru,
    descriptionUz: cat.description.uz,
    descriptionUzLatin: cat.description.uzLatin,
    descriptionRu: cat.description.ru,
    slug: cat.slug,
    iconUrl: cat.iconUrl ?? '',
    parentId: cat.parentId ?? '',
    sortOrder: String(cat.sortOrder),
    isActive: cat.isActive,
  };
}

function flattenCategories(
  categories: CategoryDto[],
  depth = 0,
  excludeId?: string
): { id: string; name: LocalizedText; depth: number }[] {
  const result: { id: string; name: LocalizedText; depth: number }[] = [];
  for (const cat of categories) {
    if (cat.id === excludeId) continue;
    result.push({ id: cat.id, name: cat.name, depth });
    if (cat.children?.length)
      result.push(...flattenCategories(cat.children, depth + 1, excludeId));
  }
  return result;
}

function CategoryTreeRow({
  category,
  depth,
  lang,
  expandedIds,
  toggleExpand,
  onEdit,
  onToggleStatus,
  togglingId,
}: {
  category: CategoryDto;
  depth: number;
  lang: keyof LocalizedText;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  onEdit: (cat: CategoryDto) => void;
  onToggleStatus: (cat: CategoryDto) => void;
  togglingId: string | null;
}) {
  const hasChildren = category.children?.length > 0;
  const isExpanded = expandedIds.has(category.id);

  return (
    <>
      <div
        className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-muted/50"
        style={{ marginLeft: depth * 24 }}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <GripVertical className="h-4 w-4 text-muted-foreground/40" />
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(category.id)}
              className="p-0.5 rounded hover:bg-muted"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {category.name[lang] || category.name.uzLatin}
            </span>
            {!category.isActive && (
              <Badge variant="secondary" className="text-[10px]">
                Nofaol
              </Badge>
            )}
          </div>
          {category.description[lang] && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {category.description[lang]}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Badge variant="outline" className="tabular-nums">
            {category.questionCount} savol
          </Badge>

          <span className="text-xs text-muted-foreground tabular-nums w-8 text-center">
            #{category.sortOrder}
          </span>

          <Switch
            checked={category.isActive}
            onCheckedChange={() => onToggleStatus(category)}
            disabled={togglingId === category.id}
            size="sm"
          />

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(category)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded &&
        category.children.map((child) => (
          <CategoryTreeRow
            key={child.id}
            category={child}
            depth={depth + 1}
            lang={lang}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            togglingId={togglingId}
          />
        ))}
    </>
  );
}

export default function CategoriesPage() {
  const { language } = useLocaleStore();
  const lang = language as keyof LocalizedText;

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [autoSlug, setAutoSlug] = useState(true);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiClient.get<CategoryDto[]>('/admin/categories');
      setCategories(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kategoriyalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const flatList = useMemo(
    () => flattenCategories(categories, 0, editingCategory?.id),
    [categories, editingCategory?.id]
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collect = (cats: CategoryDto[]) => {
      for (const cat of cats) {
        if (cat.children?.length) {
          allIds.add(cat.id);
          collect(cat.children);
        }
      }
    };
    collect(categories);
    setExpandedIds(allIds);
  };

  const collapseAll = () => setExpandedIds(new Set());

  const openCreateDialog = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setAutoSlug(true);
    setDialogOpen(true);
  };

  const openEditDialog = (cat: CategoryDto) => {
    setEditingCategory(cat);
    setForm(formFromCategory(cat));
    setAutoSlug(false);
    setDialogOpen(true);
  };

  const updateField = <K extends keyof CategoryFormData>(
    key: K,
    value: CategoryFormData[K]
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'nameUzLatin' && autoSlug)
        next.slug = slugify(value as string);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!form.nameUzLatin.trim()) {
      toast.error('Kategoriya nomi (UZ Lotin) kiritilishi shart');
      return;
    }
    if (!form.slug.trim()) {
      toast.error('Slug kiritilishi shart');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nameUz: form.nameUz,
        nameUzLatin: form.nameUzLatin,
        nameRu: form.nameRu,
        descriptionUz: form.descriptionUz,
        descriptionUzLatin: form.descriptionUzLatin,
        descriptionRu: form.descriptionRu,
        slug: form.slug,
        iconUrl: form.iconUrl || null,
        parentId: form.parentId || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };

      if (editingCategory) {
        await apiClient.put(`/admin/categories/${editingCategory.id}`, payload);
        toast.success('Kategoriya yangilandi');
      } else {
        await apiClient.post('/admin/categories', payload);
        toast.success('Kategoriya yaratildi');
      }

      setDialogOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: CategoryDto) => {
    setTogglingId(cat.id);
    try {
      await apiClient.put(`/admin/categories/${cat.id}`, {
        nameUz: cat.name.uz,
        nameUzLatin: cat.name.uzLatin,
        nameRu: cat.name.ru,
        descriptionUz: cat.description.uz,
        descriptionUzLatin: cat.description.uzLatin,
        descriptionRu: cat.description.ru,
        slug: cat.slug,
        iconUrl: cat.iconUrl,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
        isActive: !cat.isActive,
      });

      const toggleInTree = (cats: CategoryDto[]): CategoryDto[] =>
        cats.map((c) => {
          if (c.id === cat.id) return { ...c, isActive: !c.isActive };
          if (c.children?.length) return { ...c, children: toggleInTree(c.children) };
          return c;
        });

      setCategories((prev) => toggleInTree(prev));
      toast.success(cat.isActive ? 'Kategoriya o\'chirildi' : 'Kategoriya faollashtirildi');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Holatni o\'zgartirishda xatolik');
    } finally {
      setTogglingId(null);
    }
  };

  const totalCategories = useMemo(() => {
    let count = 0;
    const countAll = (cats: CategoryDto[]) => {
      for (const cat of cats) {
        count++;
        if (cat.children?.length) countAll(cat.children);
      }
    };
    countAll(categories);
    return count;
  }, [categories]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kategoriyalar</h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              Jami {totalCategories} ta kategoriya
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {categories.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={expandAll}>
                Hammasini ochish
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Hammasini yopish
              </Button>
            </>
          )}
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Kategoriya qo&apos;shish
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border px-3 py-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1 max-w-[200px]" />
              <Skeleton className="h-5 w-16 ml-auto" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-6 w-6" />
            </div>
          ))}
        </div>
      ) : !categories.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-1">Kategoriyalar mavjud emas</p>
            <p className="text-sm text-muted-foreground mb-4">
              Birinchi kategoriyani yarating
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Kategoriya qo&apos;shish
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {categories.map((cat) => (
            <CategoryTreeRow
              key={cat.id}
              category={cat}
              depth={0}
              lang={lang}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
              onEdit={openEditDialog}
              onToggleStatus={handleToggleStatus}
              togglingId={togglingId}
            />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? 'Kategoriyani tahrirlash'
                : 'Yangi kategoriya qo\'shish'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Tabs defaultValue="uzLatin">
              <TabsList className="w-full">
                <TabsTrigger value="uzLatin" className="flex-1">UZ Lotin</TabsTrigger>
                <TabsTrigger value="uz" className="flex-1">UZ Kirill</TabsTrigger>
                <TabsTrigger value="ru" className="flex-1">Русский</TabsTrigger>
              </TabsList>

              <TabsContent value="uzLatin" className="space-y-3 mt-3">
                <div>
                  <Label htmlFor="nameUzLatin">Nomi</Label>
                  <Input
                    id="nameUzLatin"
                    value={form.nameUzLatin}
                    onChange={(e) => updateField('nameUzLatin', e.target.value)}
                    placeholder="Kategoriya nomi (lotin)"
                  />
                </div>
                <div>
                  <Label htmlFor="descUzLatin">Tavsif</Label>
                  <Textarea
                    id="descUzLatin"
                    value={form.descriptionUzLatin}
                    onChange={(e) => updateField('descriptionUzLatin', e.target.value)}
                    placeholder="Tavsif (lotin)"
                    rows={2}
                  />
                </div>
              </TabsContent>

              <TabsContent value="uz" className="space-y-3 mt-3">
                <div>
                  <Label htmlFor="nameUz">Номи</Label>
                  <Input
                    id="nameUz"
                    value={form.nameUz}
                    onChange={(e) => updateField('nameUz', e.target.value)}
                    placeholder="Категория номи (кирилл)"
                  />
                </div>
                <div>
                  <Label htmlFor="descUz">Тавсиф</Label>
                  <Textarea
                    id="descUz"
                    value={form.descriptionUz}
                    onChange={(e) => updateField('descriptionUz', e.target.value)}
                    placeholder="Тавсиф (кирилл)"
                    rows={2}
                  />
                </div>
              </TabsContent>

              <TabsContent value="ru" className="space-y-3 mt-3">
                <div>
                  <Label htmlFor="nameRu">Название</Label>
                  <Input
                    id="nameRu"
                    value={form.nameRu}
                    onChange={(e) => updateField('nameRu', e.target.value)}
                    placeholder="Название категории"
                  />
                </div>
                <div>
                  <Label htmlFor="descRu">Описание</Label>
                  <Textarea
                    id="descRu"
                    value={form.descriptionRu}
                    onChange={(e) => updateField('descriptionRu', e.target.value)}
                    placeholder="Описание категории"
                    rows={2}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    updateField('slug', e.target.value);
                  }}
                  placeholder="kategoriya-slug"
                  className="flex-1"
                />
                {!autoSlug && !editingCategory && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAutoSlug(true);
                      setForm((prev) => ({
                        ...prev,
                        slug: slugify(prev.nameUzLatin),
                      }));
                    }}
                  >
                    Avto
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                URL uchun ishlatiladi. UZ Lotin nomidan avtomatik yaratiladi.
              </p>
            </div>

            <div>
              <Label htmlFor="parentId">Ota kategoriya</Label>
              <Select
                value={form.parentId || '__none__'}
                onValueChange={(v) => updateField('parentId', v === '__none__' ? '' : v as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tanlang (ixtiyoriy)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Yo&apos;q (asosiy kategoriya)</SelectItem>
                  {flatList.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {'— '.repeat(item.depth)}{item.name[lang] || item.name.uzLatin}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sortOrder">Tartib raqami</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => updateField('sortOrder', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="iconUrl">Ikonka URL</Label>
                <Input
                  id="iconUrl"
                  value={form.iconUrl}
                  onChange={(e) => updateField('iconUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(val) => updateField('isActive', val as boolean)}
              />
              <Label>Faol holat</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? 'Saqlanmoqda...'
                : editingCategory
                  ? 'Saqlash'
                  : 'Yaratish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
