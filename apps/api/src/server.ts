import { config } from "./config";
import { createJobRunRepository } from "./infrastructure/repositoryFactory";
import { createApp } from "./app";

const repo = createJobRunRepository();
const app = createApp(repo);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
