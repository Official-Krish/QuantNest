import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold text-neutral-100">Something went wrong</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Reload the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 cursor-pointer rounded-xl bg-neutral-800 px-6 py-2.5 text-sm font-medium text-neutral-100 hover:bg-neutral-700"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;