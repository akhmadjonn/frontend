'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const { ts } = useLocale();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <AlertTriangle className="h-10 w-10 text-muted-foreground" />
      <div>
        <p className="text-lg font-semibold">{ts('common.error')}</p>
        <p className="text-sm text-muted-foreground mt-1">{ts('common.unexpectedError')}</p>
      </div>
      <Button variant="outline" onClick={onReset}>
        {ts('common.retry')}
      </Button>
    </div>
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
