import React from 'react';

type P = { children: React.ReactNode };
type S = { hasError: boolean; msg?: string };
export default class VisionBoundary extends React.Component<P, S> {
  state: S = { hasError: false };
  static getDerivedStateFromError(err: any) { return { hasError: true, msg: String(err) }; }
  componentDidCatch() { /* no-op logging */ }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-200">
          Vision encountered an issue and was auto-paused. Flip back and retry.
        </div>
      );
    }
    return this.props.children;
  }
}