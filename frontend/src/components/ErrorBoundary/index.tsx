import { Component, ErrorInfo, ReactNode } from "react";

interface State {
  error: Error | null;
}

/**
 * Top-level crash guard. Without this, any render error anywhere white-screens
 * the whole app (the "crashing when passing through pages" symptom). A crash
 * now shows a recoverable screen instead — reload, or head home and continue
 * shopping; the session in localStorage is untouched.
 */
class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced in the console for support; no telemetry backend yet.
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-4 text-center">
          <p className="eyebrow">Something went wrong</p>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-ink">
            This page hit a snag
          </h1>
          <p className="text-sm leading-relaxed text-ink-soft">
            The error was recorded in the console. Reloading usually fixes it —
            your cart and sign-in are safe.
          </p>
          <pre className="max-h-28 overflow-auto rounded-xl border border-line bg-canvas p-3 text-left text-[0.6875rem] text-ink-muted">
            {this.state.error.message}
          </pre>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="primary-button !py-2"
            >
              Reload page
            </button>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.assign("/");
              }}
              className="secondary-button !py-2"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
