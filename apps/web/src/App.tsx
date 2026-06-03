import { BrowserRouter, Routes, Route } from "react-router-dom";
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
