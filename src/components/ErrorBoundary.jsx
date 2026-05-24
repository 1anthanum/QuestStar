import { Component } from "react";

/**
 * Generic Error Boundary that catches render-time errors in its subtree.
 * Renders a friendly fallback instead of letting the white screen of death happen.
 *
 * Three layers of usage:
 *   1. App root — catches catastrophic errors (whole app crashed)
 *   2. QuestBoard / panel section — keeps the rest of the app working if one panel crashes
 *   3. Each modal — local crashes don't kill the underlying page
 *
 * Props:
 *   - children: subtree to protect
 *   - fallback: optional ReactNode | (error, reset) => ReactNode override
 *   - name: short label used in the default fallback message + logged to console
 *   - onError: optional (error, info) => void  callback for telemetry
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    const tag = this.props.name || "Component";
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary:${tag}]`, error, info.componentStack);
    if (typeof this.props.onError === "function") {
      this.props.onError(error, info);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    // Custom fallback override
    if (typeof this.props.fallback === "function") {
      return this.props.fallback(this.state.error, this.reset);
    }
    if (this.props.fallback) return this.props.fallback;

    // Default fallback
    return (
      <DefaultFallback
        name={this.props.name || "this section"}
        error={this.state.error}
        onReset={this.reset}
      />
    );
  }
}

function DefaultFallback({ name, error, onReset }) {
  const isRoot = name === "App" || name === "Root";
  return (
    <div
      className={
        isRoot
          ? "min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-red-50 to-orange-50"
          : "p-4 m-2 rounded-2xl bg-red-50 border border-red-200"
      }
      role="alert"
    >
      <div className={isRoot ? "max-w-md w-full text-center space-y-4" : "space-y-3"}>
        <div className="text-4xl">⚠️</div>
        <div className="text-lg font-bold text-red-900">
          {isRoot ? "Something broke." : `${name} ran into a problem.`}
        </div>
        <p className="text-sm text-red-800 opacity-80">
          {isRoot
            ? "The app encountered an unexpected error. Your data is safe — try reloading."
            : "The rest of the app still works. You can retry this section or move on."}
        </p>
        {error?.message && (
          <details className="text-xs text-left text-red-700 bg-white/60 rounded-lg p-2 mt-2">
            <summary className="cursor-pointer font-semibold">Details</summary>
            <pre className="whitespace-pre-wrap break-words mt-2 text-[10px]">
              {error.message}
            </pre>
          </details>
        )}
        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition"
          >
            Retry
          </button>
          {isRoot && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-white border border-red-300 text-red-700 text-sm font-bold hover:bg-red-50 transition"
            >
              Reload page
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
