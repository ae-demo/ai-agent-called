// Per-request credential, reachable from a tool without the model seeing it.
import { AsyncLocalStorage } from "node:async_hooks";

export interface CallContext {
  authorization?: string;
}

export const callContext = new AsyncLocalStorage<CallContext>();
