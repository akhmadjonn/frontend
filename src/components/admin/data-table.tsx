'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  rowKey: (item: T) => string;
  onRowClick?: (item: T) => void;
  selectedIds?: Set<string>;
  onSelectChange?: (ids: Set<string>) => void;
}

export default function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = "Ma'lumot topilmadi",
  page,
  totalPages,
  onPageChange,
  rowKey,
  onRowClick,
  selectedIds,
  onSelectChange,
}: DataTableProps<T>) {
  const hasSelection = !!onSelectChange;
  const allSelected = data.length > 0 && selectedIds?.size === data.length;

  const toggleAll = () => {
    if (!onSelectChange) return;
    if (allSelected) onSelectChange(new Set());
    else onSelectChange(new Set(data.map(rowKey)));
  };

  const toggleRow = (id: string) => {
    if (!onSelectChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectChange(next);
  };

  if (loading)
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((col) => (
                <TableHead key={col.key}><Skeleton className="h-4 w-20" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key}><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );

  if (!data.length)
    return (
      <div className="rounded-lg border py-16 text-center">
        <Inbox className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );

  return (
    <div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {hasSelection && (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              const id = rowKey(item);
              const isSelected = selectedIds?.has(id);
              return (
                <TableRow
                  key={id}
                  className={`transition-colors ${isSelected ? 'bg-primary/5' : ''} ${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {hasSelection && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected ?? false}
                        onChange={() => toggleRow(id)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>{col.render(item)}</TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {totalPages && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between py-3">
          <span className="text-xs text-muted-foreground">
            Sahifa {page} / {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => onPageChange(Math.max(1, (page ?? 1) - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Oldingi
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => onPageChange(Math.min(totalPages, (page ?? 1) + 1))}
            >
              Keyingi
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
