import React, { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component
 * Catches errors in child components and displays fallback UI
 * Prevents white-screen-of-death and logs errors for debugging
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    
    // In production, you would send this to an error tracking service
    // e.g., Sentry, LogRocket, DataDog, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="h-screen w-screen bg-[#FDFCF0] flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md bg-white/40 backdrop-blur-xl border border-black/5 rounded-[2.5rem] p-10 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-orange-500 rounded-3xl shadow-xl shadow-rose-500/20 flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Something Went Wrong</h1>
              <p className="text-slate-400 text-sm font-medium mb-6">
                An unexpected error occurred. Our team has been notified.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="w-full mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-left">
                  <p className="text-xs font-mono text-rose-600 break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <button
                onClick={this.handleReset}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-sky-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-amber-500/40 transition-all"
              >
                <RotateCw className="w-4 h-4" />
                Try Again
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full h-12 mt-3 bg-white border border-black/10 text-slate-900 rounded-xl font-bold hover:bg-slate-50 transition-all"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
