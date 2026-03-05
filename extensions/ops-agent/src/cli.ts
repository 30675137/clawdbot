// extensions/ops-agent/src/cli.ts

import { WebhookServer, type WebhookServerConfig } from "./webhook-server.js";

async function main() {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const port = parseInt(process.env.WEBHOOK_PORT || "3000", 10);
  const host = process.env.WEBHOOK_HOST || "0.0.0.0";
  const path = process.env.WEBHOOK_PATH || "/feishu/events";

  if (!appId || !appSecret) {
    console.error("Error: FEISHU_APP_ID and FEISHU_APP_SECRET environment variables are required");
    process.exit(1);
  }

  const config: WebhookServerConfig = {
    appId,
    appSecret,
    port,
    host,
    path,
    encryptKey: process.env.FEISHU_ENCRYPT_KEY,
    verificationToken: process.env.FEISHU_VERIFICATION_TOKEN,
  };

  const server = new WebhookServer(config);

  try {
    await server.start();
    console.log(`✓ Ops-Agent webhook server started`);
    console.log(`  URL: http://${host}:${port}${path}`);
    console.log(`  App ID: ${appId}`);
  } catch (error) {
    console.error("Failed to start webhook server:", error);
    process.exit(1);
  }

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nShutting down...");
    await server.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\nShutting down...");
    await server.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
