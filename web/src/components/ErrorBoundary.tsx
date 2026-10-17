import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Prevents a render-time crash from blanking the whole app: the user gets a
 * readable message instead of a white screen.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ui] render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="notice error" role="alert" style={{ marginTop: 16 }}>
        <span className="n-ico">⚠</span>
        <span>
          <strong>Something went wrong while rendering this screen.</strong>
          <br />
          {this.state.error.message}
          <br />
          <button
            className="btn small"
            style={{ marginTop: 8 }}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </span>
      </div>
    );
  }
}
