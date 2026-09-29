import "./tracing.js"; // side effects only — must load before any model client
import * as http from "node:http";
import type { ModelMessage } from "ai";
import { config, missingRequiredEnv } from "./config.js";
import { runTurn } from "./agent.js";
import { callContext } from "./context.js";
import {
  ensureStore,
  initStore,
  isStoreReady,
  loadConversation,
  saveConversation,
} from "./store.js";

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(payload);
}

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return undefined; // signals malformed JSON to the caller
  }
}

// Reads the AI SDK's APICallError body; returns null for anything else. The
// one upstream error this agent relays — see "Evaluate before you open the
// PR" / guardrail handling in the agent-building skill.
function guardrailBlock(err: unknown): { name: string; reason: string } | null {
  const body = (err as { responseBody?: string })?.responseBody;
  if (!body) return null;
  try {
    const parsed = JSON.parse(body) as { message?: { action?: string; actionReason?: string; interveningGuardrail?: string } };
    const m = parsed?.message;
    if (m?.action !== "GUARDRAIL_INTERVENED") return null;
    return { name: m.interveningGuardrail ?? "guardrail", reason: m.actionReason ?? "refused by policy" };
  } catch {
    return null;
  }
}

async function handleChat(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  userId: string,
): Promise<void> {
  const raw = await readBody(req);
  if (typeof raw !== "object" || raw === null) {
    sendJson(res, 400, { error: "expected a JSON object body" });
    return;
  }
  const body = raw as { conversationId?: unknown; message?: unknown };

  if (typeof body.message !== "string" || body.message.trim() === "") {
    sendJson(res, 400, { error: "expected { message: string }" });
    return;
  }
  if (body.conversationId !== undefined && typeof body.conversationId !== "string") {
    sendJson(res, 400, { error: "conversationId must be a string when present" });
    return;
  }

  try {
    await ensureStore();
  } catch (err) {
    console.error("conversation store not ready:", err);
    sendJson(res, 500, { error: "conversation store not ready" });
    return;
  }

  let id: string;
  let history: ModelMessage[];
  if (typeof body.conversationId === "string") {
    const existing = await loadConversation(body.conversationId, userId);
    if (existing === null) {
      sendJson(res, 404, { error: "conversation not found" });
      return;
    }
    id = body.conversationId;
    history = existing;
  } else {
    id = crypto.randomUUID();
    history = [];
  }

  const full: ModelMessage[] = [...history, { role: "user", content: body.message }];

  try {
    const result = await callContext.run(
      { authorization: req.headers.authorization },
      () => runTurn(full),
    );
    await saveConversation(id, userId, [...full, ...result.messages]);
    sendJson(res, 200, { conversationId: id, text: result.text, toolCalls: result.toolCalls });
  } catch (err) {
    const guardrail = guardrailBlock(err);
    if (guardrail) {
      sendJson(res, 422, { error: guardrail.reason, guardrail: guardrail.name });
      return;
    }
    console.error("chat turn failed:", err);
    sendJson(res, 500, { error: "internal error" });
  }
}

function handleHealthz(res: http.ServerResponse): void {
  const missing = missingRequiredEnv();
  const storeStatus = isStoreReady() ? "ready" : "initialising";
  if (missing.length > 0 || storeStatus !== "ready") {
    sendJson(res, 503, { ok: false, missing, store: storeStatus });
    return;
  }
  sendJson(res, 200, { ok: true });
}

async function handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", "http://localhost");

  if (method === "GET" && url.pathname === "/healthz") {
    handleHealthz(res);
    return;
  }

  if (method === "POST" && url.pathname === "/chat") {
    // Inbound gate: reject callers the gateway did not vouch for. A header
    // Node saw twice arrives as string[] — refused rather than coerced.
    const userId = req.headers["x-user-id"];
    if (typeof userId !== "string" || userId === "") {
      res.statusCode = 401;
      res.end();
      return;
    }
    await handleChat(req, res, userId);
    return;
  }

  res.statusCode = 404;
  res.end();
}

const server = http.createServer();
server.on("request", (req, res) => {
  void handle(req, res).catch((err) => {
    console.error("request failed:", err);
    if (!res.headersSent) sendJson(res, 500, { error: "internal error" });
    else res.destroy();
  });
});

// Fire-and-forget: never await before listen(). The DB (when wired) may not
// be reachable yet; /healthz reports the not-ready condition instead of the
// pod crash-looping.
initStore();

server.listen(config.port, () => {
  console.log(`book-buddy listening on ${config.port}`);
});
