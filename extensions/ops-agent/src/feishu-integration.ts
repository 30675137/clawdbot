// extensions/ops-agent/src/feishu-integration.ts

import { JobQueue } from "./job-queue.js";
import { CommandParser } from "./parser.js";
import { OpsCommand } from "./types.js";

export interface FeishuMessage {
  userId: string;
  text: string;
  timestamp: string;
}

export interface FeishuReply {
  userId: string;
  jobId: string;
  message: string;
}

export class FeishuOpsAgent {
  private queue: JobQueue;
  private parser: CommandParser;
  private jobCallbacks: Map<string, (reply: FeishuReply) => Promise<void>> = new Map();

  constructor(maxConcurrency: number = 3) {
    this.queue = new JobQueue(maxConcurrency);
    this.parser = new CommandParser();
  }

  async handleMessage(message: FeishuMessage): Promise<FeishuReply> {
    try {
      const parsed = this.parser.parse(message.text);

      const now = Date.now();
      const command: OpsCommand = {
        id: `cmd-${now}`,
        type: parsed.type,
        params: parsed.params,
        timestamp: message.timestamp,
        userId: message.userId,
        status: "pending",
      };

      const jobId = this.queue.enqueue(command);

      // Register callback for job completion
      this.registerJobCallback(jobId, message.userId);

      return {
        userId: message.userId,
        jobId,
        message: `✓ 已接收命令，操作 ID: ${jobId}\n正在后台执行...`,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        userId: message.userId,
        jobId: "",
        message: `✗ 命令解析失败: ${errorMsg}`,
      };
    }
  }

  private registerJobCallback(jobId: string, userId: string): void {
    this.jobCallbacks.set(jobId, async (reply: FeishuReply) => {
      const record = this.queue.getJobRecord(jobId);
      if (record) {
        const statusEmoji = record.status === "success" ? "✓" : "✗";
        const message = `${statusEmoji} 操作完成\n\n输出:\n${record.output}`;

        // This would be sent back to Feishu
        console.log(`[Feishu] ${userId}: ${message}`);
      }
    });
  }

  getJobStatus(jobId: string): string | undefined {
    return this.queue.getJobStatus(jobId);
  }

  getJobRecord(jobId: string) {
    return this.queue.getJobRecord(jobId);
  }
}
