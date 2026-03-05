// extensions/ops-agent/src/e2e.test.ts

import * as http from "http";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FeishuOpsAgent } from "./feishu-integration.js";
import { WebhookServer, type WebhookServerConfig } from "./webhook-server.js";

describe("Ops-Agent E2E Tests", () => {
  let server: WebhookServer;
  const config: WebhookServerConfig = {
    appId: "cli_test_e2e",
    appSecret: "test_secret_e2e",
    port: 9997,
    host: "127.0.0.1",
    path: "/feishu/events",
  };

  beforeAll(async () => {
    server = new WebhookServer(config);
    // Note: Not starting the actual server for unit tests
  });

  afterAll(async () => {
    if (server) {
      try {
        await server.stop();
      } catch (error) {
        // Ignore
      }
    }
  });

  it("should handle complete message flow", async () => {
    const agent = server.getAgent();

    const message = {
      sender: { id: "user_e2e_001" },
      text: { content: "status" },
      chat_id: "chat_e2e_001",
      timestamp: new Date().toISOString(),
    };

    const reply = await agent.handleMessage(message);

    expect(reply).toBeDefined();
    expect(reply.userId).toBe("user_e2e_001");
    expect(reply.jobId).toBeDefined();
    expect(reply.message).toContain("已接收命令");
  });

  it("should track job through lifecycle", async () => {
    const agent = server.getAgent();

    const message = {
      sender: { id: "user_e2e_002" },
      text: { content: "diagnose" },
      chat_id: "chat_e2e_002",
      timestamp: new Date().toISOString(),
    };

    const reply = await agent.handleMessage(message);
    const jobId = reply.jobId;

    // Check initial status
    const initialStatus = agent.getJobStatus(jobId);
    expect(initialStatus).toBe("running");

    // Get job record
    const record = agent.getJobRecord(jobId);
    expect(record).toBeDefined();
    expect(record?.command.type).toBe("diagnose");
    expect(record?.command.userId).toBe("user_e2e_002");
  });

  it("should handle multiple concurrent commands", async () => {
    const agent = server.getAgent();

    const commands = [
      { text: "status", user: "user_e2e_003" },
      { text: "config get gateway.mode", user: "user_e2e_004" },
      { text: "check-update", user: "user_e2e_005" },
    ];

    const replies = await Promise.all(
      commands.map((cmd) =>
        agent.handleMessage({
          sender: { id: cmd.user },
          text: { content: cmd.text },
          chat_id: `chat_${cmd.user}`,
          timestamp: new Date().toISOString(),
        }),
      ),
    );

    expect(replies).toHaveLength(3);
    replies.forEach((reply, index) => {
      expect(reply.jobId).toBeDefined();
      expect(reply.userId).toBe(commands[index].user);
    });
  });

  it("should handle invalid commands gracefully", async () => {
    const agent = server.getAgent();

    const message = {
      sender: { id: "user_e2e_006" },
      text: { content: "invalid-command-xyz-abc" },
      chat_id: "chat_e2e_006",
      timestamp: new Date().toISOString(),
    };

    const reply = await agent.handleMessage(message);

    expect(reply.jobId).toBe("");
    expect(reply.message).toContain("命令解析失败");
  });

  it("should parse and execute config commands", async () => {
    const agent = server.getAgent();

    const message = {
      sender: { id: "user_e2e_007" },
      text: { content: "config set gateway.mode local" },
      chat_id: "chat_e2e_007",
      timestamp: new Date().toISOString(),
    };

    const reply = await agent.handleMessage(message);

    expect(reply.jobId).toBeDefined();
    expect(reply.message).toContain("已接收命令");

    const record = agent.getJobRecord(reply.jobId);
    expect(record?.command.params.key).toBe("gateway.mode");
    expect(record?.command.params.value).toBe("local");
  });

  it("should handle update commands with version", async () => {
    const agent = server.getAgent();

    const message = {
      sender: { id: "user_e2e_008" },
      text: { content: "update-to 2026.3.5" },
      chat_id: "chat_e2e_008",
      timestamp: new Date().toISOString(),
    };

    const reply = await agent.handleMessage(message);

    expect(reply.jobId).toBeDefined();

    const record = agent.getJobRecord(reply.jobId);
    expect(record?.command.type).toBe("update-to");
    expect(record?.command.params.version).toBe("2026.3.5");
  });

  it("should preserve user context across commands", async () => {
    const agent = server.getAgent();
    const userId = "user_e2e_009";

    const commands = ["status", "config get gateway.mode", "diagnose"];

    const replies = await Promise.all(
      commands.map((cmd) =>
        agent.handleMessage({
          sender: { id: userId },
          text: { content: cmd },
          chat_id: "chat_e2e_009",
          timestamp: new Date().toISOString(),
        }),
      ),
    );

    replies.forEach((reply) => {
      const record = agent.getJobRecord(reply.jobId);
      expect(record?.command.userId).toBe(userId);
    });
  });
});
