import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AuthErrorBoundary } from "./AuthErrorBoundary";
import { ForbiddenError } from "../api/client";

// Helper components that throw
function ThrowsForbidden(): never {
  throw new ForbiddenError();
}

function ThrowsOther(): never {
  throw new Error("some other error");
}

describe("AuthErrorBoundary", () => {
  it("shows access denied on ForbiddenError", () => {
    // Suppress React's error logging noise for this test
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <AuthErrorBoundary>
        <ThrowsForbidden />
      </AuthErrorBoundary>,
    );

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
  });

  it("rethrows non-Forbidden errors", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    // The boundary rethrows, so rendering should throw
    expect(() =>
      render(
        <AuthErrorBoundary>
          <ThrowsOther />
        </AuthErrorBoundary>,
      ),
    ).toThrow("some other error");
  });
});
