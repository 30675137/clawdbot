// extensions/ops-agent/src/feishu-integration.ts

import * as Lark from "@larksuiteoapi/node-sdk";
import { JobQueue } from "./job-queue.js";
import { CommandParser } from "./parser.js";
import { OpsCommand } from "./types.js";

export interface FeishuConfig {
  appId: string;
  appSecret: string;
  encryptKey?: string;
  verificationToken?: string;
}

export class FeishuOpsAgent {
  private queue: JobQueue;
  private parser: CommandParser;
  private client: Lark.Client;
  private jobCallbacks: Map<string, (reply: any) => Promise<void>> = new Map();

  constructor(config: FeishuConfig, maxConcurrency: number = 3) {
    this.queue = new JobQueue(maxConcurrency);
    this.parser = new CommandParser();

    this.client = new Lark.Client({
      id: config.appId,
      secret: config.appSecret,
      disableTokenCache: false,
    });
  }

  async handleMessage(message: any): Promise<any> {
    try {
      const text = message.text?.content || message.content || "";
      const userId = message.sender?.id || message.from_id || "";
      const timestamp = new Date().toISOString();

      const parsed = this.parser.parse(text);

      const now = Date.now();
      const command: OpsCommand = {
        id: `cmd-${now}`,
        type: parsed.type,
        params: parsed.params,
        timestamp,
        userId,
        status: "pending",
      };

      const jobId = this.queue.enqueue(command);

      // Register callback for job completion
      this.registerJobCallback(jobId, userId, message.chat_id || message.conversation_id);

      return {
        userId,
        jobId,
        message: `✓ 已接收命令，操作 ID: ${jobId}\n正在后台执行...`,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        userId: message.sender?.id || "",
        jobId: "",
        message: `✗ 命令解析失败: ${errorMsg}`,
      };
    }
  }

  private registerJobCallback(jobId: string, userId: string, chatId: string): void {
    this.jobCallbacks.set(jobId, async (reply: any) => {
      const record = this.queue.getJobRecord(jobId);
      if (record) {
        const statusEmoji = record.status === "success" ? "✓" : "✗";
        const message = `${statusEmoji} 操作完成\n\n输出:\n${record.output}`;

        // Send reply back to Feishu
        try {
          await this.sendMessage(chatId, message);
        } catch (error) {
          console.error("Failed to send Feishu reply:", error);
        }
      }
    });
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    try {
      await this.client.im.message.create({
        data: {
          receive_id: chatId,
          msg_type: "text",
          content: JSON.stringify({
            text: text,
          }),
        },
      });
    } catch (error) {
      console.error("Failed to send message to Feishu:", error);
      throw error;
    }
  }

  getJobStatus(jobId: string): string | undefined {
    return this.queue.getJobStatus(jobId);
  }

  getJobRecord(jobId: string) {
    return this.queue.getJobRecord(jobId);
  }

  getClient(): Lark.Client {
    return this.client;
  }
}
