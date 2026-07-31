import { Component, type ReactNode } from "react";
import { ForbiddenError } from "../api/client"; // adjust path
import { AccessDenied } from "./AccessDenied";

interface Props {
  children: ReactNode;
}

interface State {
  forbidden: boolean;
}

/**
 * Catches ForbiddenError (thrown when the API returns 403 for non-admin
 * users) from anywhere in the app and shows the access-denied page.
 *
 * Other errors are rethrown so they can be handled elsewhere
 */
export class AuthErrorBoundary extends Component<Props, State> {
  state: State = { forbidden: false };

  static getDerivedStateFromError(error: unknown): State {
    if (error instanceof ForbiddenError) {
      return { forbidden: true };
    }
    // rethrow
    throw error;
  }

  render() {
    if (this.state.forbidden) {
      return <AccessDenied />;
    }
    return this.props.children;
  }
}
