// extensions/ops-agent/src/webhook-server.ts

import * as http from "http";
import * as Lark from "@larksuiteoapi/node-sdk";
import { FeishuOpsAgent, FeishuConfig } from "./feishu-integration.js";

export interface WebhookServerConfig extends FeishuConfig {
  port: number;
  host?: string;
  path?: string;
}

export class WebhookServer {
  private server: http.Server | null = null;
  private agent: FeishuOpsAgent;
  private config: WebhookServerConfig;

  constructor(config: WebhookServerConfig) {
    this.config = {
      port: config.port,
      host: config.host || "0.0.0.0",
      path: config.path || "/feishu/events",
      appId: config.appId,
      appSecret: config.appSecret,
      encryptKey: config.encryptKey,
      verificationToken: config.verificationToken,
    };

    this.agent = new FeishuOpsAgent(config);
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        try {
          await this.handleRequest(req, res);
        } catch (error) {
          console.error("Request handling error:", error);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      });

      this.server.listen(this.config.port, this.config.host, () => {
        console.log(
          `Webhook server listening on ${this.config.host}:${this.config.port}${this.config.path}`,
        );
        resolve();
      });

      this.server.on("error", reject);
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // Only accept POST requests to the webhook path
    if (req.method !== "POST" || req.url !== this.config.path) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    // Read request body
    const body = await this.readBody(req);
    const payload = JSON.parse(body);

    // Handle Feishu challenge verification
    if (payload.type === "url_verification") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ challenge: payload.challenge }));
      return;
    }

    // Handle message events
    if (payload.type === "event_callback") {
      const event = payload.event;

      // Only handle message events
      if (event.message?.message_type === "text") {
        const message = {
          sender: { id: event.sender?.sender_id?.open_id || event.sender?.sender_id?.user_id },
          text: { content: event.message?.content },
          chat_id: event.message?.chat_id,
          timestamp: new Date().toISOString(),
        };

        try {
          const reply = await this.agent.handleMessage(message);

          // Send immediate acknowledgment
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ code: 0, msg: "ok" }));

          // Send reply asynchronously
          if (reply.jobId) {
            setTimeout(async () => {
              try {
                await this.agent.sendMessage(message.chat_id, reply.message);
              } catch (error) {
                console.error("Failed to send reply:", error);
              }
            }, 100);
          }
        } catch (error) {
          console.error("Failed to handle message:", error);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ code: 0, msg: "ok" }));
        }
      } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ code: 0, msg: "ok" }));
      }
    } else {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: 0, msg: "ok" }));
    }
  }

  private readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        resolve(body);
      });
      req.on("error", reject);
    });
  }

  getAgent(): FeishuOpsAgent {
    return this.agent;
  }
}
