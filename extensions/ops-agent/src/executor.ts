// extensions/ops-agent/src/executor.ts

import { exec } from "child_process";
import { promisify } from "util";
import { ParsedCommand } from "./parser.js";

const execAsync = promisify(exec);

export interface ExecutionResult {
  status: "success" | "failed";
  output: string;
  error?: string;
  duration: number;
}

export class CommandExecutor {
  async execute(command: ParsedCommand): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      const shellCommand = this.buildShellCommand(command);
      const { stdout, stderr } = await execAsync(shellCommand, {
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      });

      const duration = Date.now() - startTime;
      return {
        status: "success",
        output: stdout || stderr,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        status: "failed",
        output: "",
        error: errorMessage,
        duration,
      };
    }
  }

  private buildShellCommand(command: ParsedCommand): string {
    switch (command.type) {
      case "install":
        return "npm install -g openclaw";
      case "install-deps":
        return "pnpm install";
      case "update":
        return "npm install -g openclaw@latest";
      case "update-to":
        return `npm install -g openclaw@${command.params.version}`;
      case "check-update":
        return "npm view openclaw version";
      case "config-get":
        return `openclaw config get ${command.params.key}`;
      case "config-set":
        return `openclaw config set ${command.params.key} ${command.params.value}`;
      case "config-list":
        return "openclaw config list";
      case "diagnose":
        return "openclaw doctor";
      case "status":
        return "openclaw status";
      case "logs":
        const lines = command.params.lines || "20";
        return `tail -n ${lines} /tmp/openclaw-gateway.log`;
      case "history":
        return "cat ~/.openclaw/ops-agent/history.jsonl | tail -20";
      case "history-clear":
        return "rm -f ~/.openclaw/ops-agent/history.jsonl";
      default:
        throw new Error(`Unknown command type: ${command.type}`);
    }
  }
}
