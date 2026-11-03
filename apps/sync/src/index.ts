import "dotenv/config";

async function main(): Promise<void> {
  console.log(`[sync] started at ${new Date().toISOString()}`);
  console.log(`[sync] finished at ${new Date().toISOString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[sync] failed:", error);
    process.exit(1);
  });
