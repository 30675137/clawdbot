import { describe, expect, it } from "vitest";
import { buildAgentSystemPrompt } from "./system-prompt.js";

describe("buildAgentSystemPrompt browser section", () => {
  it("includes browser section when browser tool is available", () => {
    const prompt = buildAgentSystemPrompt({
      workspaceDir: "/tmp/test",
      toolNames: ["browser", "read", "write"],
      promptMode: "full",
    });

    expect(prompt).toContain("## Browser");
    expect(prompt).toContain("Use the browser tool when the user wants to:");
    expect(prompt).toContain("browser action=start");
    expect(prompt).toContain("Proactive triggers");
  });

  it("excludes browser section when browser tool is not available", () => {
    const prompt = buildAgentSystemPrompt({
      workspaceDir: "/tmp/test",
      toolNames: ["read", "write"],
      promptMode: "full",
    });

    expect(prompt).not.toContain("## Browser");
    expect(prompt).not.toContain("Use the browser tool when the user wants to:");
  });

  it("excludes browser section in minimal mode", () => {
    const prompt = buildAgentSystemPrompt({
      workspaceDir: "/tmp/test",
      toolNames: ["browser", "read", "write"],
      promptMode: "minimal",
    });

    expect(prompt).not.toContain("## Browser");
  });

  it("includes expanded browser tool summary", () => {
    const prompt = buildAgentSystemPrompt({
      workspaceDir: "/tmp/test",
      toolNames: ["browser"],
      promptMode: "full",
    });

    expect(prompt).toContain(
      "browser: Browse websites, take screenshots, analyze pages, click/type/fill forms",
    );
  });
});
