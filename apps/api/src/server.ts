import express from "express";
import jobRunsRoutes from "./http/jobRuns.routes";

const app = express();

app.use(express.json());

// Health check
app.get("/health", (_, res) => {
  res.send("OK");
});

// Mount API routes
app.use("/api", jobRunsRoutes);

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
