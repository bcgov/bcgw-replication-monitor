import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ForbiddenError } from "./api/client.ts";
import App from "./App.tsx";
import "@bcgov/bc-sans/css/BC_Sans.css";
import "./styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Let ForbiddenError propagate to the nearest error boundary
      throwOnError: (error) => error instanceof ForbiddenError,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
