import express from "express";

const app = express();

app.use(express.json());

// Health check
app.get("/health", (_, res) => {
  res.send("OK");
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
