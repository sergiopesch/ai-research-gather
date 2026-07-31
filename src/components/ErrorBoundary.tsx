import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<object>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<object>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#fbfaf7] p-4">
          <section className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-8 text-center">
              <div className="mx-auto mb-4 w-fit rounded-full bg-red-50 p-3">
                <AlertTriangle className="h-8 w-8 text-red-700" />
              </div>
              <h1 className="mb-2 font-editorial text-3xl text-stone-950">
                Something went wrong
              </h1>
              <p className="mb-6 text-sm text-stone-500">
                An unexpected error occurred. Please try again.
              </p>
              {import.meta.env.DEV && this.state.error ? (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-stone-500 hover:text-stone-950">
                    Error details (Development)
                  </summary>
                  <pre className="mt-2 overflow-auto rounded bg-stone-100 p-2 text-xs">
                    {this.state.error.message}
                    {this.state.errorInfo && `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`}
                  </pre>
                </details>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })} 
                  className="min-h-11 flex-1 rounded-md border border-stone-300 px-4 text-sm font-medium text-stone-700 transition-colors hover:border-stone-500"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="min-h-11 flex-1 rounded-md bg-stone-950 px-4 text-sm font-medium text-white transition-colors hover:bg-stone-800"
                >
                  Refresh Page
                </button>
              </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
