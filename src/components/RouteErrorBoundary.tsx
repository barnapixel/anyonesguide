import { Component, type ReactNode } from 'react'
import { PageError } from './PageError'
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <PageError /> : this.props.children }
}
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return <Boundary>{children}</Boundary>
}
