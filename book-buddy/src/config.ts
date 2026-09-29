// Env, read once, in one place. Every other module reads through this.
export const config = {
  port: Number(process.env.PORT ?? 9090),

  // library-service dependency (component) — searchBooks / getBook base address.
  libraryServiceUrl: process.env.LIBRARY_SERVICE_URL,

  // Model access — always injected by the platform for an ai-agent component.
  modelName: process.env.MODEL_NAME,
  modelEndpoint: process.env.MODEL_ENDPOINT,
  modelApiKey: process.env.MODEL_API_KEY,
  modelApiKeyHeader: process.env.MODEL_API_KEY_HEADER,

  // Conversation store — no postgres-cnpg dependency is declared for this
  // component in design.json, so these are always unset and the store falls
  // back to the in-memory backing (see store.ts). Reading them here, rather
  // than adding a special case, is what lets a future db dependency wire in
  // with no code change.
  memoryDbHost: process.env.MEMORY_DB_HOST,
  memoryDbPort: process.env.MEMORY_DB_PORT,
  memoryDbName: process.env.MEMORY_DB_DBNAME,
  memoryDbUser: process.env.MEMORY_DB_USER,
  memoryDbPassword: process.env.MEMORY_DB_PASSWORD,

  // Tracing — inert unless both are set (see tracing.ts).
  ampOtelEndpoint: process.env.AMP_OTEL_ENDPOINT,
  ampAgentApiKey: process.env.AMP_AGENT_API_KEY,
  otelServiceName: process.env.OTEL_SERVICE_NAME,
};

/** Env vars required for the agent to actually serve a turn. */
export function missingRequiredEnv(): string[] {
  const missing: string[] = [];
  if (!config.modelName) missing.push("MODEL_NAME");
  if (!config.modelEndpoint) missing.push("MODEL_ENDPOINT");
  if (!config.modelApiKey) missing.push("MODEL_API_KEY");
  if (!config.libraryServiceUrl) missing.push("LIBRARY_SERVICE_URL");
  return missing;
}
