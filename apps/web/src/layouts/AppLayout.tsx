import { Outlet } from "react-router-dom";
import { Header } from "@bcgov/design-system-react-components";
import { AppFooter } from "./AppFooter";

/**
 * Root layout used by all pages.
 *
 * Renders BC Gov header and footer with a main content area.
 * Child routes render inside <Outlet />.
 */
export function AppLayout() {
  return (
    <>
      <Header
        title="BCGW Replication Monitoring Dashboard"
        skipLinks={[<a href="#main-content">Skip to main content</a>]}
      />
      <main id="main-content" style={{ padding: "1rem", flex: 1 }}>
        <Outlet />
      </main>
      <AppFooter />
    </>
  );
}
