// extensions/ops-agent/src/storage.ts

import { promises as fs } from "fs";
import { homedir } from "os";
import { join } from "path";
import { JobRecord, StateStore } from "./types.js";

const STORAGE_DIR = join(homedir(), ".openclaw", "ops-agent");
const HISTORY_FILE = join(STORAGE_DIR, "history.jsonl");
const STATE_FILE = join(STORAGE_DIR, "state.json");

export class StorageManager {
  async ensureDir(): Promise<void> {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }

  async appendHistory(job: JobRecord): Promise<void> {
    await this.ensureDir();
    const line = JSON.stringify(job) + "\n";
    await fs.appendFile(HISTORY_FILE, line);
  }

  async getHistory(limit: number = 50): Promise<JobRecord[]> {
    try {
      const content = await fs.readFile(HISTORY_FILE, "utf-8");
      const lines = content
        .trim()
        .split("\n")
        .filter((l) => l);
      return lines.slice(-limit).map((line) => JSON.parse(line) as JobRecord);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async saveState(state: StateStore): Promise<void> {
    await this.ensureDir();
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
  }

  async getState(): Promise<StateStore | null> {
    try {
      const content = await fs.readFile(STATE_FILE, "utf-8");
      return JSON.parse(content) as StateStore;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await fs.unlink(HISTORY_FILE);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }
}
