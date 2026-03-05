// extensions/ops-agent/src/job-queue.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { JobQueue } from "./job-queue.js";
import { OpsCommand } from "./types.js";

describe("JobQueue", () => {
  let queue: JobQueue;

  beforeEach(() => {
    queue = new JobQueue(2);
  });

  it("should enqueue a job", () => {
    const command: OpsCommand = {
      id: "test-1",
      type: "status",
      params: {},
      timestamp: new Date().toISOString(),
      userId: "user1",
      status: "pending",
    };

    const jobId = queue.enqueue(command);
    expect(jobId).toBeDefined();
    expect(jobId).toMatch(/^ops-/);
  });

  it("should track job status", () => {
    const command: OpsCommand = {
      id: "test-2",
      type: "status",
      params: {},
      timestamp: new Date().toISOString(),
      userId: "user1",
      status: "pending",
    };

    const jobId = queue.enqueue(command);
    const status = queue.getJobStatus(jobId);
    expect(status).toBe("running");
  });

  it("should get job record", () => {
    const command: OpsCommand = {
      id: "test-3",
      type: "status",
      params: {},
      timestamp: new Date().toISOString(),
      userId: "user1",
      status: "pending",
    };

    const jobId = queue.enqueue(command);
    const record = queue.getJobRecord(jobId);
    expect(record).toBeDefined();
    expect(record?.command.type).toBe("status");
  });
});
