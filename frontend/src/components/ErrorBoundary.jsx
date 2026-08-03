import { Component } from "react";
import ErrorPage from "../pages/ErrorPage";

// A class component is required here -- React error boundaries can only
// be implemented as classes (there is no hook equivalent as of this
// React version). This catches any uncaught rendering error anywhere
// below it in the tree and shows the existing ErrorPage instead of a
// blank white screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In a real production setup this is where you'd send the error to
    // a logging service (e.g. Sentry). For now, log to the console so
    // it's visible during development/debugging.
    console.error("Uncaught application error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage error={this.state.error} resetErrorBoundary={this.handleReset} />
      );
    }
    return this.props.children;
  }
}