import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-black mb-4">Terjadi Kesalahan Sistem</h1>
          <p className="text-slate-400 max-w-md mb-8">
            Aplikasi mengalami kendala teknis. Silakan muat ulang halaman atau hubungi administrator.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold transition-all"
          >
            Muat Ulang Halaman
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-black/50 rounded-lg text-left text-xs overflow-auto max-w-full">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
