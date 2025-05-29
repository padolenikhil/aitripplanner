import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
    errorInfo: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ margin: '20px', padding: '20px', border: '1px solid #ff000030', backgroundColor: '#ff000010', borderRadius: '8px', color: '#D8000C' }}>
          <h1 style={{ fontSize: '1.5em', color: '#D8000C', marginBottom: '10px' }}>Something went wrong.</h1>
          <p style={{ marginBottom: '10px' }}>We've encountered an error. Please try refreshing the page. If the problem persists, please check the console for more details.</p>
          {this.state.error && (
            <details style={{ marginTop: '15px', whiteSpace: 'pre-wrap', background: '#f0f0f0', border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
              <p style={{ marginTop: '5px', fontFamily: 'monospace', fontSize: '0.9em' }}>{this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <p style={{ marginTop: '5px', fontFamily: 'monospace', fontSize: '0.9em' }}>
                  Component Stack: {this.state.errorInfo.componentStack}
                </p>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;