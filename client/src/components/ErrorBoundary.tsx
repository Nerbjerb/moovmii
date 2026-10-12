import { Component, type ErrorInfo, type ReactNode } from "react";

// Top-level safety net. A render-time throw anywhere below this unmounts the
// whole React tree to a blank white screen, which is especially bad on the
// kiosk and on phones mid-setup. Instead of a blank page, show a small
// recoverable message with a reload button.
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep a breadcrumb in the console for debugging; never rethrow.
    console.error("App crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        style={{
          ...font,
          minHeight: "100svh",
          backgroundColor: "#0b0b0b",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "24px",
          gap: "18px",
        }}
      >
        <div style={{ fontSize: "19px", fontWeight: 600 }}>Something went wrong</div>
        <div style={{ fontSize: "14px", color: "#b9b9b9", maxWidth: "320px", lineHeight: 1.4 }}>
          The app hit an unexpected error. Reloading usually fixes it.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            ...font,
            marginTop: "4px",
            padding: "12px 28px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#ffffff",
            color: "#0b0b0b",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
