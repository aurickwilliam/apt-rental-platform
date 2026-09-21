// graphify OpenCode plugin (V2 API)
// Injects a knowledge graph reminder before bash tool calls when the graph exists.
//
// IMPORTANT: keep the reminder string free of backticks and $(...) constructs.
// The hook prepends `echo "<reminder>" ; <cmd>` to the tool input command;
// backticks inside the double-quoted echo trigger shell command substitution,
// which both corrupts tool output and silently executes the very graphify
// command we are only suggesting. Plain words render fine in opencode's TUI.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Plugin } from "@opencode/plugin";

const REMINDER =
  'echo "[graphify] knowledge graph at graphify-out/. For focused questions, run graphify query with your question (scoped subgraph, usually much smaller than GRAPH_REPORT.md) instead of grepping raw files. Read GRAPH_REPORT.md only for broad architecture context."';

export default Plugin.define({
  id: "graphify",
  async setup(ctx) {
    const directory = ctx.location.directory;
    let reminded = false;

    await ctx.tool.hook("execute.before", (event) => {
      if (reminded) return;
      if (event.tool !== "bash") return;
      if (!existsSync(join(directory, "graphify-out", "graph.json"))) return;

      const input = event.input;
      if (!input || typeof input !== "object") return;
      if (!("command" in input)) return;
      const command = input.command;
      if (typeof command !== "string" || command.length === 0) return;

      // ';' not '&&' — Windows PowerShell 5.1 rejects '&&' as a statement
      // separator, breaking the first bash command of the session (#1646).
      input.command = REMINDER + " ; " + command;
      reminded = true;
    });
  },
});
