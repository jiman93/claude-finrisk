import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  controlType: string;
  required: boolean;
  onSkip?: () => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class CheckpointErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[CheckpointErrorBoundary] ${this.props.controlType} failed:`,
      error,
      info.componentStack
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="cp-error-boundary">
          <div className="cp-error-boundary-icon">!</div>
          <div className="cp-error-boundary-title">
            Control failed to load
          </div>
          <div className="cp-error-boundary-detail">
            <strong>{this.props.controlType}</strong> encountered an error:
            {" "}{this.state.errorMessage || "Unknown render error"}
          </div>
          <div className="cp-error-boundary-actions">
            <button
              type="button"
              className="pi-secondary-btn"
              onClick={this.handleRetry}
            >
              Retry
            </button>
            {!this.props.required && this.props.onSkip && (
              <button
                type="button"
                className="pi-secondary-btn"
                onClick={this.props.onSkip}
              >
                Skip
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
