import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AuthGate } from "./AuthGate";

// Mock the useAuth hook to control each scenario
vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../hooks/useAuth";

describe("AuthGate", () => {
  it("shows loading while checking", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: true,
      isError: false,
      isAdmin: false,
      roles: [],
      user: undefined,
    });

    render(
      <AuthGate>
        <div>App Content</div>
      </AuthGate>,
    );
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows access denied for non-admin", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      isError: false,
      isAdmin: false,
      roles: ["viewer"],
      user: undefined,
    });

    render(
      <AuthGate>
        <div>App Content</div>
      </AuthGate>,
    );
    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(screen.queryByText("App Content")).not.toBeInTheDocument();
  });

  it("renders children for admin", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      isError: false,
      isAdmin: true,
      roles: ["admin"],
      user: undefined,
    });

    render(
      <AuthGate>
        <div>App Content</div>
      </AuthGate>,
    );
    expect(screen.getByText("App Content")).toBeInTheDocument();
  });
});
