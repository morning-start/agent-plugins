#!/usr/bin/env node
/**
 * verify-server.mjs — MCP server exposing the verify.mjs engine (X-3).
 *
 * Exposes the key plugin-factory verification capabilities as Model Context
 * Protocol tools over stdio, so other agents/tools can call them without
 * shelling out. Zero runtime dependencies (stdlib only) — the same
 * dependency-free pattern as the generated `mcp-servers/` stub.
 *
 * Protocol: JSON-RPC 2.0 over stdio (MCP), protocol version 2024-11-05.
 *   - initialize
 *   - tools/list
 *   - tools/call:  verify | lifecycle_report
 *
 * Tools:
 *   verify(root, layers?, coverage?)       -> runChecks() findings + exit code
 *   lifecycle_report(root)                 -> markdown lifecycle report
 *
 * Usage:
 *   node mcp/verify-server.mjs             # stdio server (harness-registered)
 *   node mcp/verify-server.mjs --self-test # run executeTool once, then exit
 *
 * Harness registration (Claude Code `.mcp.json`):
 *   { "mcpServers": { "plugin-factory-verify": { "command": "node", "args": ["mcp/verify-server.mjs"] } } }
 */
import { pathToFileURL } from "node:url";
import { runChecks } from "./verify.mjs";
import { renderLifecycleReport } from "./lifecycle-report.mjs";

const PROTOCOL_VERSION = "2024-11-05";
const ALLOWED_LAYERS = ["structure", "harness", "orchestration"];
const ALLOWED_COVERAGE = ["WARN", "FAIL"];

const tools = [
  {
    name: "verify",
    description:
      "Run the plugin-factory verification engine (structure/harness/orchestration layers) against a plugin root and return severity-ranked findings plus the exit code (1 = any FAIL finding blocks release).",
    inputSchema: {
      type: "object",
      properties: {
        root: { type: "string", description: "Plugin project root directory." },
        layers: {
          type: "array",
          items: { type: "string", enum: ALLOWED_LAYERS },
          description: "Layers to run (default: all three).",
        },
        coverage: {
          type: "string",
          enum: ALLOWED_COVERAGE,
          description: "When set, also run the test-coverage probe at this severity.",
        },
      },
      required: ["root"],
    },
  },
  {
    name: "lifecycle_report",
    description:
      "Generate the markdown lifecycle report (signal distribution, severity-ranked findings, recommendations) for a plugin root.",
    inputSchema: {
      type: "object",
      properties: {
        root: { type: "string", description: "Plugin project root directory." },
      },
      required: ["root"],
    },
  },
];

/** Execute one MCP tool call; returns MCP content items. */
export async function executeTool(name, args) {
  const root = String(args?.root ?? "");
  if (!root) throw new Error("missing required argument: root");
  if (name === "verify") {
    const layers = Array.isArray(args.layers) && args.layers.length > 0 ? args.layers : undefined;
    for (const l of layers ?? []) {
      if (!ALLOWED_LAYERS.includes(l)) throw new Error(`invalid layer: ${l}`);
    }
    if (args.coverage && !ALLOWED_COVERAGE.includes(args.coverage)) {
      throw new Error(`invalid coverage: ${args.coverage}`);
    }
    const result = await runChecks(root, {
      layers,
      coverage: args.coverage,
    });
    const exitCode = result.findings.some((f) => f.severity === "FAIL") ? 1 : 0;
    return [
      {
        type: "text",
        text: JSON.stringify({ root, exitCode, findings: result.findings }, null, 2),
      },
    ];
  }
  if (name === "lifecycle_report") {
    const result = await runChecks(root, { layers: ["orchestration"] });
    const report = renderLifecycleReport(root, result.findings);
    return [{ type: "text", text: report }];
  }
  throw new Error(`unknown tool: ${name}`);
}

/* --- stdio JSON-RPC transport (dependency-free) --- */

function readMessage() {
  return new Promise((resolve, reject) => {
    let buf = "";
    const onData = (chunk) => {
      buf += chunk;
      let idx;
      while ((idx = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.trim() === "") continue;
        process.stdin.removeListener("data", onData);
        try {
          resolve(JSON.parse(line));
        } catch (err) {
          reject(err);
        }
        return;
      }
    };
    process.stdin.on("data", onData);
  });
}

function sendMessage(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

async function serve() {
  while (true) {
    const msg = await readMessage();
    if (!msg) break;
    if (msg.method === "initialize") {
      sendMessage({
        jsonrpc: "2.0",
        id: msg.id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: "plugin-factory-verify", version: "0.1.0" },
        },
      });
    } else if (msg.method === "tools/list") {
      sendMessage({ jsonrpc: "2.0", id: msg.id, result: { tools } });
    } else if (msg.method === "tools/call") {
      try {
        const content = await executeTool(msg.params.name, msg.params.arguments);
        sendMessage({ jsonrpc: "2.0", id: msg.id, result: { content } });
      } catch (err) {
        sendMessage({
          jsonrpc: "2.0",
          id: msg.id,
          error: { code: -32603, message: String(err?.message || err) },
        });
      }
    } else if (msg.method === "notifications/initialized") {
      /* no-op */
    } else {
      sendMessage({
        jsonrpc: "2.0",
        id: msg.id,
        error: { code: -32601, message: `method not found: ${msg.method}` },
      });
    }
  }
}

async function main() {
  if (process.argv.includes("--self-test")) {
    const out = await executeTool("verify", { root: process.cwd(), layers: ["structure"] });
    console.log(out[0].text.slice(0, 2000));
    return;
  }
  await serve();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`verify-server: ${err.message}`);
    process.exit(1);
  });
}
