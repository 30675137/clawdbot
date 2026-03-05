// extensions/ops-agent/src/job-queue.ts

import { CommandExecutor, ExecutionResult } from "./executor.js";
import { CommandParser, ParsedCommand } from "./parser.js";
import { StorageManager } from "./storage.js";
import { OpsCommand, JobRecord, JobEvent } from "./types.js";

export class JobQueue {
  private queue: OpsCommand[] = [];
  private running: Map<string, JobRecord> = new Map();
  private maxConcurrency: number;
  private executor: CommandExecutor;
  private storage: StorageManager;
  private parser: CommandParser;
  private activeCount: number = 0;

  constructor(maxConcurrency: number = 3) {
    this.maxConcurrency = maxConcurrency;
    this.executor = new CommandExecutor();
    this.storage = new StorageManager();
    this.parser = new CommandParser();
  }

  enqueue(command: OpsCommand): string {
    const now = Date.now();
    const rand = Math.random().toString(36).substr(2, 9);
    const jobId = `ops-${now}-${rand}`;

    const jobRecord: JobRecord = {
      jobId,
      command,
      events: [
        {
          timestamp: new Date().toISOString(),
          type: "start",
          message: `Job ${jobId} started`,
        },
      ],
      startTime: new Date().toISOString(),
      status: "running",
      output: "",
    };

    this.running.set(jobId, jobRecord);
    this.queue.push(command);
    this.processQueue();

    return jobId;
  }

  getJobStatus(jobId: string): string | undefined {
    const record = this.running.get(jobId);
    return record?.status;
  }

  getJobRecord(jobId: string): JobRecord | undefined {
    return this.running.get(jobId);
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.activeCount < this.maxConcurrency) {
      const command = this.queue.shift();
      if (!command) break;

      this.activeCount++;
      this.executeJob(command).finally(() => {
        this.activeCount--;
        this.processQueue();
      });
    }
  }

  private async executeJob(command: OpsCommand): Promise<void> {
    const now = Date.now();
    const rand = Math.random().toString(36).substr(2, 9);
    const jobId = `ops-${now}-${rand}`;
    const jobRecord: JobRecord = {
      jobId,
      command,
      events: [],
      startTime: new Date().toISOString(),
      status: "running",
      output: "",
    };

    this.running.set(jobId, jobRecord);

    try {
      const parsed = this.parser.parse(command.type);
      const result = await this.executor.execute(parsed);

      jobRecord.events.push({
        timestamp: new Date().toISOString(),
        type: result.status === "success" ? "complete" : "error",
        message: result.status === "success" ? "Job completed" : "Job failed",
        error: result.error,
      });

      jobRecord.status = result.status === "success" ? "success" : "failed";
      jobRecord.output = result.output;
      jobRecord.endTime = new Date().toISOString();

      await this.storage.appendHistory(jobRecord);
    } catch (error) {
      jobRecord.events.push({
        timestamp: new Date().toISOString(),
        type: "error",
        message: "Job execution error",
        error: error instanceof Error ? error.message : String(error),
      });

      jobRecord.status = "failed";
      jobRecord.endTime = new Date().toISOString();

      await this.storage.appendHistory(jobRecord);
    }
  }
}
