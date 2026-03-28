'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from '@/hooks/use-locale';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, BookOpen, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GlossaryCategoryDto, GlossaryTermDto, PaginatedList } from '@/types/content';

export default function GlossaryPage() {
  const { t, ts } = useLocale();
  const [categories, setCategories] = useState<GlossaryCategoryDto[]>([]);
  const [terms, setTerms] = useState<GlossaryTermDto[]>([]);
  const [searchResults, setSearchResults] = useState<GlossaryTermDto[] | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await apiClient.get<GlossaryCategoryDto[]>('/glossary/categories');
        setCategories(result);
      } catch (err: any) {
        toast.error(err?.message || ts('common.error'));
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTerms = async (categorySlug: string | null) => {
    setLoadingTerms(true);
    setSearchResults(null);
    try {
      if (categorySlug) {
        const result = await apiClient.get<PaginatedList<GlossaryTermDto>>(
          `/glossary/categories/${categorySlug}/terms`
        );
        setTerms(result.items);
      } else {
        const allTerms: GlossaryTermDto[] = [];
        for (const cat of categories) {
          const catTerms = await apiClient.get<PaginatedList<GlossaryTermDto>>(
            `/glossary/categories/${cat.slug}/terms`
          );
          allTerms.push(...catTerms.items);
        }
        setTerms(allTerms);
      }
    } catch (err: any) {
      toast.error(err?.message || ts('common.error'));
    } finally {
      setLoadingTerms(false);
    }
  };

  useEffect(() => {
    if (!loadingCategories && categories.length > 0)
      fetchTerms(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingCategories, categories.length]);

  const handleCategoryChange = (slug: string | null) => {
    setActiveCategory(slug);
    setExpandedId(null);
    setSearch('');
    setSearchResults(null);
    fetchTerms(slug);
  };

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (search.trim().length > 2) {
      searchTimerRef.current = setTimeout(async () => {
        try {
          const result = await apiClient.get<PaginatedList<GlossaryTermDto>>(
            `/glossary/search?q=${encodeURIComponent(search.trim())}`
          );
          setSearchResults(result.items);
        } catch (err: any) {
          toast.error(err?.message || ts('common.error'));
        }
      }, 400);
    } else {
      setSearchResults(null);
    }

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const displayTerms = searchResults ?? terms;

  const filteredTerms = search.trim().length > 0 && !searchResults
    ? displayTerms.filter((term) =>
        t(term.term).toLowerCase().includes(search.toLowerCase()) ||
        t(term.definition).toLowerCase().includes(search.toLowerCase())
      )
    : displayTerms;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{ts('glossary.title')}</h1>
      </div>

      {loadingCategories ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => handleCategoryChange(null)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border',
              activeCategory === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            )}
          >
            {ts('glossary.allCategories')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border',
                activeCategory === cat.slug
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-border'
              )}
            >
              {t(cat.name)}
              <span className="ml-1.5 text-xs opacity-70">{cat.termCount}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={ts('glossary.searchTerms')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loadingTerms ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTerms.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {search.trim() ? ts('glossary.noResults') : ts('glossary.noTerms')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTerms.map((term) => {
            const isExpanded = expandedId === term.id;
            return (
              <Card
                key={term.id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/50',
                  isExpanded && 'ring-1 ring-primary/20'
                )}
                onClick={() => setExpandedId(isExpanded ? null : term.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">{t(term.term)}</p>
                        {term.relatedQuestionIds.length > 0 && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            <HelpCircle className="h-3 w-3 mr-1" />
                            {term.relatedQuestionIds.length} {ts('glossary.relatedQuestions')}
                          </Badge>
                        )}
                      </div>
                      {isExpanded && (
                        <p className="text-xs font-medium text-muted-foreground mt-2">
                          {ts('glossary.definition')}
                        </p>
                      )}
                      <p className={cn(
                        'text-sm text-muted-foreground leading-relaxed',
                        isExpanded ? 'mt-0.5' : 'mt-1 line-clamp-2'
                      )}>
                        {t(term.definition)}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
