import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AppFooter } from "./AppFooter";

describe("AppFooter", () => {
  it("renders all footer links", () => {
    render(<AppFooter />);

    expect(screen.getByText("Disclaimer")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toBeInTheDocument();
    expect(screen.getByText("Copyright")).toBeInTheDocument();
    expect(screen.getByText("Contact Us")).toBeInTheDocument();
  });

  it("footer links have correct hrefs", () => {
    render(<AppFooter />);

    expect(screen.getByText("Disclaimer").closest("a")).toHaveAttribute(
      "href",
      "https://www2.gov.bc.ca/gov/content/home/disclaimer"
    );
    expect(screen.getByText("Privacy").closest("a")).toHaveAttribute(
      "href",
      "https://www2.gov.bc.ca/gov/content/home/privacy"
    );
    expect(screen.getByText("Copyright").closest("a")).toHaveAttribute(
      "href",
      "https://www2.gov.bc.ca/gov/content/home/copyright"
    );
  });
});