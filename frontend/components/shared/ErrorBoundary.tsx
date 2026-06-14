'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { AlertTriangle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 自定义降级 UI */
  fallback?: ReactNode;
  /** 错误回调（可用于上报） */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React 错误边界。
 * 捕获子组件树渲染期间的运行时错误，展示降级 UI 并提供"重试"。
 * 注意：error boundary 必须是 class component。
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
    // 生产环境可在此接入 Sentry 等监控
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          role="alert"
          className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <AlertTriangle className="text-destructive size-10" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">出了点问题</h2>
            <p className="text-muted-foreground text-sm">
              页面渲染时发生错误，请尝试重新加载。
            </p>
          </div>
          <Button onClick={this.handleReset} variant="outline" size="sm">
            <RotateCcw className="size-4" />
            重试
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
