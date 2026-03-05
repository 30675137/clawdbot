// extensions/ops-agent/src/feishu-integration.test.ts

import { describe, it, expect } from "vitest";
import { FeishuOpsAgent } from "./feishu-integration.js";

describe("FeishuOpsAgent", () => {
  const agent = new FeishuOpsAgent(2);

  it("should handle valid command message", async () => {
    const message = {
      userId: "user123",
      text: "status",
      timestamp: new Date().toISOString(),
    };

    const reply = await agent.handleMessage(message);
    expect(reply.userId).toBe("user123");
    expect(reply.jobId).toBeDefined();
    expect(reply.message).toContain("已接收命令");
  });

  it("should handle invalid command message", async () => {
    const message = {
      userId: "user123",
      text: "invalid-command-xyz",
      timestamp: new Date().toISOString(),
    };

    const reply = await agent.handleMessage(message);
    expect(reply.userId).toBe("user123");
    expect(reply.jobId).toBe("");
    expect(reply.message).toContain("命令解析失败");
  });

  it("should track job status", async () => {
    const message = {
      userId: "user123",
      text: "diagnose",
      timestamp: new Date().toISOString(),
    };

    const reply = await agent.handleMessage(message);
    const status = agent.getJobStatus(reply.jobId);
    expect(status).toBeDefined();
  });

  it("should get job record", async () => {
    const message = {
      userId: "user123",
      text: "config get gateway.mode",
      timestamp: new Date().toISOString(),
    };

    const reply = await agent.handleMessage(message);
    const record = agent.getJobRecord(reply.jobId);
    expect(record).toBeDefined();
    expect(record?.command.userId).toBe("user123");
  });
});
