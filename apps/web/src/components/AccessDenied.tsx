/**
 * Shown when the user is authenticated via SSO but is not a member of the
 * admin group (API returned 403).
 */
export function AccessDenied() {
  return (
    <div className="access-denied">
      <h1>Access Denied</h1>
    </div>
  );
}
