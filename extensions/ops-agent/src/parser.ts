// extensions/ops-agent/src/parser.ts

import { CommandType } from "./types.js";

export interface ParsedCommand {
  type: CommandType;
  params: Record<string, string>;
}

export class CommandParser {
  private commandPatterns: Map<CommandType, RegExp> = new Map([
    ["install", /^install$/],
    ["install-deps", /^install-deps$/],
    ["update", /^update$/],
    ["update-to", /^update-to\s+(.+)$/],
    ["check-update", /^check-update$/],
    ["config-get", /^config\s+get\s+(.+)$/],
    ["config-set", /^config\s+set\s+(\S+)\s+(.+)$/],
    ["config-list", /^config\s+list$/],
    ["diagnose", /^diagnose$/],
    ["status", /^status$/],
    ["logs", /^logs(?:\s+(\d+))?$/],
    ["history", /^history$/],
    ["history-clear", /^history\s+clear$/],
  ]);

  parse(input: string): ParsedCommand {
    const trimmed = input.trim();

    for (const [type, pattern] of this.commandPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return this.buildCommand(type, match);
      }
    }

    throw new Error(`Unknown command: ${trimmed}`);
  }

  private buildCommand(type: CommandType, match: RegExpMatchArray): ParsedCommand {
    const params: Record<string, string> = {};

    switch (type) {
      case "update-to":
        if (!match[1]) throw new Error("update-to requires version");
        params.version = match[1];
        break;
      case "config-get":
        if (!match[1]) throw new Error("config get requires key");
        params.key = match[1];
        break;
      case "config-set":
        if (!match[1] || !match[2]) throw new Error("config set requires key and value");
        params.key = match[1];
        params.value = match[2];
        break;
      case "logs":
        if (match[1]) params.lines = match[1];
        break;
    }

    return { type, params };
  }
}
