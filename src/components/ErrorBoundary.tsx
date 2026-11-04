import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="bg-charcoal p-8 rounded-2xl border border-danger max-w-lg w-full text-center">
            <h1 className="text-2xl font-bold text-danger mb-4">Application Error</h1>
            <p className="text-ivory text-sm mb-6">Something went wrong. Please take a screenshot of this error and send it to support.</p>
            <div className="bg-black p-4 rounded-lg text-left overflow-auto max-h-60">
              <code className="text-danger-light text-xs font-mono">
                {this.state.error?.toString()}
              </code>
            </div>
            <button 
              onClick={() => window.location.href = '/login'} 
              className="mt-6 bg-gold text-black font-bold py-2 px-6 rounded-lg hover:opacity-90"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}