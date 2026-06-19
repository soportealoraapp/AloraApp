'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-8">
          <Card className="max-w-md w-full p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">Ups, algo no salió bien</h2>
            <p className="text-muted-foreground text-sm">
              No pudimos cargar esta sección. Por favor, intenta de nuevo.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/discover'}>
                <Home className="h-4 w-4 mr-2" /> Inicio
              </Button>
            </div>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
