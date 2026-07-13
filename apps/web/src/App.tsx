import { BrowserRouter, Routes, Route } from "react-router-dom";
import { JobHistoryPage } from "./pages/JobHistoryPage";
import { AppLayout } from "./layouts/AppLayout";
import { JobRunsPage } from "./pages/JobRunsPage";

/**
 * Root app router.
 *
 * All pages are wrapped inside AppLayout.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<JobRunsPage />} />
          <Route path="history/:jobId" element={<JobHistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
