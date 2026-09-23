import { Router } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "../mcp/server.js";

export const mcpRouter = Router();

// Stateless mode: Vercel's serverless functions don't share memory across
// invocations (or even across concurrent requests to the "same" deployment),
// so a stateful in-memory MCP session tied to a session-id header couldn't
// reliably be found again on a follow-up request anyway. Instead every
// request gets its own McpServer + transport pair, connected, handled, and
// torn down - matching how each of our REST requests is already independent.
async function handleMcpRequest(req, res) {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}

// The Streamable HTTP spec uses POST for JSON-RPC calls and (optionally) GET
// for a server-initiated SSE stream; the transport itself answers DELETE and
// GET with the correct response for stateless mode (no session to end/open).
mcpRouter.post("/", handleMcpRequest);
mcpRouter.get("/", handleMcpRequest);
mcpRouter.delete("/", handleMcpRequest);
