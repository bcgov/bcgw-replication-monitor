import { Footer } from "@bcgov/design-system-react-components";

/**
 * Custom footer with BC Gov standard links.
 * Wraps the design system Footer with project-specific links.
 */
export function AppFooter() {
  const footerLinks = (
    <ul className="footer-links">
      <li>
        <a href="https://www2.gov.bc.ca/gov/content/home/disclaimer">
          Disclaimer
        </a>
      </li>
      <li>
        <a href="https://www2.gov.bc.ca/gov/content/home/privacy">Privacy</a>
      </li>
      <li>
        <a href="https://www2.gov.bc.ca/gov/content/home/copyright">
          Copyright
        </a>
      </li>
      <li>
        <a href="https://dpdd.atlassian.net/servicedesk/customer/portal/1/group/1/create/30">
          Contact Us
        </a>
      </li>
    </ul>
  );

  return <Footer>{footerLinks}</Footer>;
}
