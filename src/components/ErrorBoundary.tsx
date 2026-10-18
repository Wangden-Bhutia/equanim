import { Component, type ReactNode } from 'react';

interface State { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-app px-6 py-16">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-muted">Equanim hit an unexpected error. Your saved data has not been deleted. Reloading usually helps.</p>
        <button className="btn-primary mt-6" onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
}
