// tracing.ts — imported for side effects from the top of main.ts, before
// anything creates a model client. Inert when the platform sets no
// AMP_OTEL_ENDPOINT / AMP_AGENT_API_KEY; never fails startup over tracing.
import { trace } from "@opentelemetry/api";
import { NodeTracerProvider, BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { config } from "./config.js";

export const tracer = trace.getTracer("agent");

if (config.ampOtelEndpoint && config.ampAgentApiKey) {
  const provider = new NodeTracerProvider({
    // SET THIS OR THE TRACES ARE ANONYMOUS.
    resource: new Resource({
      "service.name": config.otelServiceName ?? "book-buddy",
    }),
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          // The exporter appends nothing — AMP_OTEL_ENDPOINT is a base.
          url: `${config.ampOtelEndpoint}/v1/traces`,
          headers: { "x-amp-api-key": config.ampAgentApiKey },
        }),
      ),
    ],
  });
  provider.register();
  // Without this the last spans of a turn die with the pod.
  process.on("SIGTERM", () => {
    void provider.shutdown().finally(() => process.exit(0));
  });
}
