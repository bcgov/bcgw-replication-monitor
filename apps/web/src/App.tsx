import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";

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
          <Route index element={<div>Home page</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
