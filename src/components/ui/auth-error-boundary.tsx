'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component for authentication flows
 * Catches JavaScript errors anywhere in the child component tree
 */
export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console for debugging
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
    
    // Show user-friendly toast message
    toast.error('Something went wrong with authentication. Please try again.');
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-full max-w-md space-y-6 p-8 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Please try again or contact support if the problem persists.
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={this.handleRetry}
                className="w-full"
              >
                Try Again
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/app/login'}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useAuthErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`Auth error${context ? ` in ${context}` : ''}:`, error);
    
    // Show appropriate error message based on error type
    if (error.message?.includes('Network')) {
      toast.error('Network error. Please check your internet connection.');
    } else if (error.message?.includes('rate limit') || error.message?.includes('Too many')) {
      toast.error('Too many attempts. Please wait before trying again.');
    } else {
      toast.error('An unexpected error occurred. Please try again.');
    }
  }, []);

  return { handleError };
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <AuthErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AuthErrorBoundary>
    );
  };
}