// extensions/ops-agent/tests/parser.test.ts

import { describe, it, expect } from "vitest";
import { CommandParser } from "../src/parser.js";

describe("CommandParser", () => {
  const parser = new CommandParser();

  it("should parse install command", () => {
    const result = parser.parse("install");
    expect(result.type).toBe("install");
    expect(result.params).toEqual({});
  });

  it("should parse update command", () => {
    const result = parser.parse("update");
    expect(result.type).toBe("update");
  });

  it("should parse update-to with version", () => {
    const result = parser.parse("update-to 2026.3.5");
    expect(result.type).toBe("update-to");
    expect(result.params.version).toBe("2026.3.5");
  });

  it("should parse config get", () => {
    const result = parser.parse("config get gateway.mode");
    expect(result.type).toBe("config-get");
    expect(result.params.key).toBe("gateway.mode");
  });

  it("should parse config set", () => {
    const result = parser.parse("config set gateway.mode local");
    expect(result.type).toBe("config-set");
    expect(result.params.key).toBe("gateway.mode");
    expect(result.params.value).toBe("local");
  });

  it("should throw on invalid command", () => {
    expect(() => parser.parse("invalid-command")).toThrow();
  });

  it("should throw on missing required params", () => {
    expect(() => parser.parse("update-to")).toThrow();
  });
});
