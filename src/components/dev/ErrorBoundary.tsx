// src/components/dev/ErrorBoundary.tsx
import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: unknown };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-md border border-destructive/30 bg-destructive/10">
          <h2 className="text-lg font-semibold mb-2">Erro na aba Geografia</h2>
          <pre className="text-sm whitespace-pre-wrap">
            {String(this.state.error ?? "Erro desconhecido")}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
