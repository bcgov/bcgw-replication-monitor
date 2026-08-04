import { BrowserRouter, Routes, Route } from "react-router-dom";
import { JobHistoryPage } from "./pages/JobHistoryPage";
import { AppLayout } from "./layouts/AppLayout";
import { JobRunsPage } from "./pages/JobRunsPage";
import { AuthErrorBoundary } from "./components/AuthErrorBoundary";
import { AuthGate } from "./components/AuthGate";

/**
 * Root app router.
 *
 * All pages are wrapped inside AppLayout.
 */
function App() {
  return (
    <BrowserRouter>
      <AuthErrorBoundary>
        <AuthGate>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<JobRunsPage />} />
              <Route path="history/:jobId" element={<JobHistoryPage />} />
            </Route>
          </Routes>
        </AuthGate>
      </AuthErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
