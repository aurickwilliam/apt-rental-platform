// graphify OpenCode plugin (v2 format: default export with id + setup).
// Injects a knowledge graph reminder before bash tool calls when the graph exists.
//
// IMPORTANT: keep the reminder string free of backticks and $(...) constructs.
// The hook prepends `echo "<reminder>" ; <cmd>` to the user's bash command;
// backticks inside the double-quoted echo trigger bash command substitution,
// which both corrupts tool output and silently executes the very graphify
// command we are only suggesting. Plain words render fine in opencode's TUI.
import { existsSync } from "fs";
import { join } from "path";

const REMINDER =
  'echo "[graphify] knowledge graph at graphify-out/. For focused questions, run graphify query with your question (scoped subgraph, usually much smaller than GRAPH_REPORT.md) instead of grepping raw files. Read GRAPH_REPORT.md only for broad architecture context." ; ';

export default {
  id: "graphify",
  setup: async (ctx) => {
    const directory = ctx.location?.directory ?? process.cwd();
    let reminded = false;

    ctx.tool.hook("execute.before", async (event) => {
      if (reminded) return;
      if (event?.tool !== "bash") return;
      if (!existsSync(join(directory, "graphify-out", "graph.json"))) return;
      const args = event.input;
      if (!args || typeof args.command !== "string") return;

      // ';' not '&&' — Windows PowerShell 5.1 rejects '&&' as a statement
      // separator, breaking the first bash command of the session (#1646).
      args.command = REMINDER + args.command;
      reminded = true;
    });
  },
};
