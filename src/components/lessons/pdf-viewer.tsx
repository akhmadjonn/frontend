'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  url: string;
  onPageChange?: (currentPage: number, totalPages: number) => void;
  onComplete?: () => void;
  className?: string;
}

export function PdfViewer({ url, onPageChange, onComplete, className }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartDistance = useRef(0);
  const initialScale = useRef(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries)
        setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
    setLoading(false);
    setPageNumber(1);
    onPageChange?.(1, total);
  }, [onPageChange]);

  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > numPages) return;
    setPageNumber(page);
    onPageChange?.(page, numPages);
    if (page === numPages && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [numPages, onPageChange, onComplete]);

  const goNext = useCallback(() => goToPage(pageNumber + 1), [goToPage, pageNumber]);
  const goPrev = useCallback(() => goToPage(pageNumber - 1), [goToPage, pageNumber]);
  const zoomIn = useCallback(() => setScale((s) => Math.min(3, s + 0.25)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(0.5, s - 0.25)), []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev(); }
      else if (e.key === 'Escape' && isFullscreen) { document.exitFullscreen?.(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, isFullscreen]);

  const getDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      touchStartDistance.current = getDistance(e.touches);
      initialScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistance.current > 0) {
      const currentDistance = getDistance(e.touches);
      const ratio = currentDistance / touchStartDistance.current;
      setScale(Math.min(3, Math.max(0.5, initialScale.current * ratio)));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1 && touchStartDistance.current === 0) {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      if (absDx > 50 && absDx > absDy * 1.5) {
        if (dx < 0) goNext(); else goPrev();
      }
    }
    touchStartDistance.current = 0;
  };

  const progressPercent = numPages > 0 ? (pageNumber / numPages) * 100 : 0;
  const pageWidth = containerWidth > 0 ? containerWidth - (isFullscreen ? 64 : 16) : undefined;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex flex-col rounded-xl overflow-hidden select-none border border-border',
        isFullscreen ? 'bg-muted/95 fixed inset-0 z-50 rounded-none border-none' : 'bg-card',
        className,
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bar */}
      <div className="h-1.5 bg-muted w-full shrink-0">
        <div
          className="h-full bg-[oklch(0.588_0.158_241)] transition-all duration-300 rounded-r-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* PDF Content */}
      <div className={cn(
        'flex-1 flex items-start justify-center overflow-auto',
        isFullscreen ? 'p-8' : 'p-2',
      )}>
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Skeleton className="h-[500px] w-full max-w-[600px] rounded-lg" />
          </div>
        )}
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() => setLoading(false)}
            loading={null}
            className="flex justify-center"
          >
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              loading={<Skeleton className="h-[500px] w-full max-w-[600px] rounded-lg" />}
              className="shadow-lg rounded-sm overflow-hidden"
            />
          </Document>
        </div>
      </div>

      {/* Controls */}
      {numPages > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-card/95 backdrop-blur-sm border-t border-border shrink-0">
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon-sm" onClick={zoomOut} disabled={scale <= 0.5} className="h-8 w-8">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon-sm" onClick={zoomIn} disabled={scale >= 3} className="h-8 w-8">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon-sm" onClick={goPrev} disabled={pageNumber <= 1} className="h-8 w-8">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-foreground min-w-[60px] text-center tabular-nums">
              {pageNumber} / {numPages}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={goNext} disabled={pageNumber >= numPages} className="h-8 w-8">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <Button variant="ghost" size="icon-sm" onClick={toggleFullscreen} className="h-8 w-8">
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
