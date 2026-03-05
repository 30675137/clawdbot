// extensions/ops-agent/src/feishu-integration.test.ts

import { describe, it, expect, vi } from "vitest";
import { FeishuOpsAgent } from "./feishu-integration.js";

describe("FeishuOpsAgent", () => {
  const config = {
    appId: "cli_test",
    appSecret: "test_secret",
  };

  const agent = new FeishuOpsAgent(config, 2);

  it("should handle valid command message", async () => {
    const message = {
      sender: { id: "user123" },
      text: { content: "status" },
      chat_id: "chat123",
      timestamp: Date.now(),
    };

    const reply = await agent.handleMessage(message);
    expect(reply.userId).toBe("user123");
    expect(reply.jobId).toBeDefined();
    expect(reply.message).toContain("已接收命令");
  });

  it("should handle invalid command message", async () => {
    const message = {
      sender: { id: "user123" },
      text: { content: "invalid-command-xyz" },
      chat_id: "chat123",
      timestamp: Date.now(),
    };

    const reply = await agent.handleMessage(message);
    expect(reply.userId).toBe("user123");
    expect(reply.jobId).toBe("");
    expect(reply.message).toContain("命令解析失败");
  });

  it("should track job status", async () => {
    const message = {
      sender: { id: "user123" },
      text: { content: "diagnose" },
      chat_id: "chat123",
      timestamp: Date.now(),
    };

    const reply = await agent.handleMessage(message);
    const status = agent.getJobStatus(reply.jobId);
    expect(status).toBeDefined();
  });

  it("should get job record", async () => {
    const message = {
      sender: { id: "user123" },
      text: { content: "config get gateway.mode" },
      chat_id: "chat123",
      timestamp: Date.now(),
    };

    const reply = await agent.handleMessage(message);
    const record = agent.getJobRecord(reply.jobId);
    expect(record).toBeDefined();
    expect(record?.command.userId).toBe("user123");
  });

  it("should expose Lark client", () => {
    const client = agent.getClient();
    expect(client).toBeDefined();
  });
});
