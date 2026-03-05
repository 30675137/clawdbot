// extensions/ops-agent/src/executor.test.ts

import { describe, it, expect } from "vitest";
import { CommandExecutor } from "./executor.js";
import { ParsedCommand } from "./parser.js";

describe("CommandExecutor", () => {
  const executor = new CommandExecutor();

  it("should execute status command", async () => {
    const command: ParsedCommand = {
      type: "status",
      params: {},
    };

    const result = await executor.execute(command);
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("output");
    expect(result).toHaveProperty("duration");
  });

  it("should return execution result with duration", async () => {
    const command: ParsedCommand = {
      type: "check-update",
      params: {},
    };

    const result = await executor.execute(command);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("should build correct shell command for config-get", () => {
    const executor2 = new CommandExecutor();
    const cmd = (executor2 as any).buildShellCommand({
      type: "config-get",
      params: { key: "gateway.mode" },
    });
    expect(cmd).toBe("openclaw config get gateway.mode");
  });

  it("should build correct shell command for config-set", () => {
    const executor2 = new CommandExecutor();
    const cmd = (executor2 as any).buildShellCommand({
      type: "config-set",
      params: { key: "gateway.mode", value: "local" },
    });
    expect(cmd).toBe("openclaw config set gateway.mode local");
  });

  it("should build correct shell command for update-to", () => {
    const executor2 = new CommandExecutor();
    const cmd = (executor2 as any).buildShellCommand({
      type: "update-to",
      params: { version: "2026.3.5" },
    });
    expect(cmd).toBe("npm install -g openclaw@2026.3.5");
  });
});
