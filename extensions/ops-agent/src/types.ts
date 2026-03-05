// extensions/ops-agent/src/types.ts

export type CommandType =
  | "install"
  | "install-deps"
  | "update"
  | "update-to"
  | "check-update"
  | "config-get"
  | "config-set"
  | "config-list"
  | "diagnose"
  | "status"
  | "logs"
  | "history"
  | "history-clear";

export interface OpsCommand {
  id: string;
  type: CommandType;
  params: Record<string, string>;
  timestamp: string;
  userId: string;
  status: "pending" | "running" | "success" | "failed";
}

export interface JobEvent {
  timestamp: string;
  type: "start" | "progress" | "complete" | "error";
  message: string;
  progress?: number;
  error?: string;
}

export interface JobRecord {
  jobId: string;
  command: OpsCommand;
  events: JobEvent[];
  startTime: string;
  endTime?: string;
  status: "running" | "success" | "failed";
  output: string;
}

export interface StateStore {
  lastUpdate: string;
  currentVersion: string;
  config: Record<string, unknown>;
}
