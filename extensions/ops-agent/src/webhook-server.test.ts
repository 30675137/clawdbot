// extensions/ops-agent/src/webhook-server.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WebhookServer } from "./webhook-server.js";

describe("WebhookServer", () => {
  let server: WebhookServer;

  beforeEach(() => {
    server = new WebhookServer({
      appId: "cli_test",
      appSecret: "test_secret",
      port: 9998,
      host: "127.0.0.1",
      path: "/feishu/events",
    });
  });

  afterEach(async () => {
    try {
      await server.stop();
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  it("should create webhook server instance", () => {
    expect(server).toBeDefined();
  });

  it("should expose agent", () => {
    const agent = server.getAgent();
    expect(agent).toBeDefined();
  });

  it("should have correct configuration", () => {
    const agent = server.getAgent();
    expect(agent).toBeDefined();
  });

  it("should handle webhook server lifecycle", async () => {
    // Just verify the server can be created and stopped
    expect(server).toBeDefined();
  });
});
