// GENERATED from x-aep.tools.openapi[].allow in
// specs/design/components/book-buddy/agent.afm.md (allow: [searchBooks,
// getBook]), against the operations of that name in
// specs/design/components/library-service/openapi.yaml. Only these two
// operations are generated — the allow-list is the security boundary; do not
// add another tool here, however useful it looks, without the design
// widening the allow-list first.
import { tool } from "ai";
import { z } from "zod";
import { config } from "./config.js";
import { callContext } from "./context.js";

// Shared by every tool: joins the injected base address with `new URL`
// (never string concatenation — an injected address may end in `/`),
// attaches the caller's credential, and shapes the result defensively so a
// provider that returns HTML or an empty body on an error still produces a
// tool result rather than throwing.
async function call(
  method: string,
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const base = config.libraryServiceUrl;
  if (!base) {
    return { ok: false, status: 0, body: { error: "LIBRARY_SERVICE_URL is not configured" } };
  }
  const url = new URL(path.replace(/^\//, ""), base.endsWith("/") ? base : `${base}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const { authorization } = callContext.getStore() ?? {};
  const headers: Record<string, string> = {};
  if (authorization) headers.authorization = authorization;

  const response = await fetch(url, { method, headers });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: response.ok, status: response.status, body };
}

export const tools = {
  searchBooks: tool({
    description:
      "Search the library catalogue, optionally filtered by genre and/or author",
    inputSchema: z.object({
      genre: z.string().optional().describe("filter to books of this genre"),
      author: z.string().optional().describe("filter to books by this author"),
      limit: z.number().int().min(1).max(100).optional().describe("page size, defaults to 20"),
      offset: z.number().int().min(0).optional().describe("page offset, defaults to 0"),
    }),
    execute: ({ genre, author, limit, offset }) =>
      call("GET", "/books", { genre, author, limit, offset }),
  }),

  getBook: tool({
    description: "Read one book's detail and current availability by its id",
    inputSchema: z.object({
      id: z.string().describe("the book's id"),
    }),
    execute: ({ id }) => call("GET", `/books/${encodeURIComponent(id)}`),
  }),
};
