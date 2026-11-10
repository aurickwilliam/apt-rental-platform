// graphify OpenCode plugin
// Keeps sessions on AGENTS.md's Graphify-first rule while graphify-out/graph.json
// exists. For each session the plugin:
//   - prepends a reminder to the first (up to three) shell commands, until a
//     graphify command has actually run in that session; one copy of the
//     plugin (or of a reminder) claims a command, additional copies loaded
//     from other locations never add a second reminder to it;
//   - refuses the session's first dedicated grep/glob search once with the
//     same guidance, so an agent that starts with raw grepping reads the
//     instruction and runs graphify query itself. Everything is allowed again
//     once graphify has run in the session; the refusal never repeats, and
//     searches about graphify itself are always allowed.
//
// One file for both runtimes. OpenCode 2 reads `id` and `setup()` from the
// default export; OpenCode 1 (1.3.4 and later) reads `server()` from it. Each
// ignores the other's function. Nothing is imported from an opencode package:
// a plain file in .opencode/plugins/ cannot resolve one.
//
// IMPORTANT: keep both strings free of backticks and $(...) constructs. The
// hook prepends `echo "<reminder>" ; <cmd>` to the user's shell command;
// backticks inside the double-quoted echo trigger command substitution,
// which both corrupts tool output and silently executes the very graphify
// command we are only suggesting. The refusal travels as the tool error, and
// plain words render fine in opencode's TUI.
//
// Behavioral coverage: node scripts/graphify-plugin.test.mjs
import { existsSync } from "fs";
import { join } from "path";

const REMINDER =
  'echo "[graphify] knowledge graph at graphify-out/. For focused questions, run graphify query with your question (scoped subgraph, usually much smaller than GRAPH_REPORT.md) instead of grepping raw files. Read GRAPH_REPORT.md only for broad architecture context." ; ';

const REFUSAL =
  "[graphify] The knowledge graph has not been used yet in this session, and per AGENTS.md graphify is the default navigation before raw search. Run graphify query with your question first (a scoped traversal usually much smaller than a grep sweep; add --budget N to cap output), graphify explain for one concept, or graphify path for the route between two concepts. This refusal happens once per session: after any graphify command every search runs normally, and searches about graphify itself are always allowed.";

// The refusal throws from a tool hook, so it blocks the call and reaches the
// model as the reason. Latching `refused` before throwing guarantees it is
// once per session even where a runtime ignored the throw.
const SEARCH_TOOLS = new Set(["grep", "glob"]);
const REMINDER_LIMIT = 3;

// A real graphify use is a `graphify <command>` invocation in a command
// position, not prose in an echoed reminder or a quoted search pattern.
// Handlers always receive and test raw commands (see owedReminder's guard).
// The lookbehind keeps quoted mentions (grep -rn "graphify hook status") out;
// a residual mismatch only over-allows (fewer reminders, one refusal at
// most), never over-blocks.
const GRAPHIFY_USE = /(?<!["'])\bgraphify\s+\S/;

const hasGraph = (directory) => existsSync(join(directory, "graphify-out", "graph.json"));

// A project and a directory above it (often ~) can each hold a copy of this
// file, and OpenCode loads both. OpenCode 2 fails the second plugin with the
// same id ("Duplicate plugin ID"), so the id carries this file's location. The
// copies share one record of session progress, so a session gets one coherent
// reminder/refusal sequence no matter which copy fires.
const location = [...import.meta.url].reduce((hash, ch) => (Math.imul(hash, 31) + ch.charCodeAt(0)) >>> 0, 7);
const sessions = (globalThis.__graphifySessions ??= new Map());

function sessionState(key) {
  const existing = sessions.get(key);
  if (existing) return existing;
  const created = { reminders: 0, usedGraphify: false, refused: false };
  sessions.set(key, created);
  return created;
}

function markGraphifyUse(state, command) {
  if (state.usedGraphify || !GRAPHIFY_USE.test(command)) return false;
  state.usedGraphify = true;
  return true;
}

// Returns true when the command still owes a reminder; the caller rewrites it.
// Later hook callbacks see earlier callbacks' rewrites (a second copy of this
// plugin loaded from another location, or a retried call): those commands
// carry the reminder prefix and must never be reminded or use-detected again,
// otherwise the reminder prose ("run graphify query...") would latch
// usedGraphify and disable the session's search refusal.
function oweReminder(state, command) {
  if (command.startsWith(REMINDER)) return false;
  if (markGraphifyUse(state, command)) return false;
  if (state.usedGraphify || state.reminders >= REMINDER_LIMIT) return false;
  state.reminders += 1;
  return true;
}

function refuseFirstSearch(key, input) {
  const state = sessionState(key);
  if (state.usedGraphify || state.refused) return;
  if (typeof input?.pattern !== "string" || /\bgraphify\b/i.test(input.pattern)) return;
  state.refused = true;
  throw new Error(REFUSAL);
}

export default {
  id: `graphify-${location.toString(16)}`,

  // OpenCode 2: the command tool is "shell"; one server outlives many
  // sessions, so progress is keyed by session id (falling back to "*").
  async setup(ctx) {
    await ctx.tool.hook("execute.before", (event) => {
      if (typeof event?.tool !== "string") return;
      if (!hasGraph(ctx.location.directory)) return;
      const key = event.sessionID ?? "*";

      if (event.tool === "shell" && typeof event.input?.command === "string") {
        const command = event.input.command;
        const state = sessionState(key);
        if (oweReminder(state, command)) {
          event.input = { ...event.input, command: REMINDER + command };
        }
        return;
      }

      if (SEARCH_TOOLS.has(event.tool)) refuseFirstSearch(key, event.input);
    });
  },

  // OpenCode 1: the command tool is "bash", and the server lives as long as
  // the session, so progress is keyed by session id when one arrives and by
  // project directory otherwise.
  async server({ directory }) {
    return {
      "tool.execute.before": async (input, output) => {
        if (typeof input?.tool !== "string") return;
        if (!hasGraph(directory)) return;
        const key = typeof input.sessionID === "string" ? input.sessionID : directory;

        if (input.tool === "bash" && typeof output.args?.command === "string") {
          const command = output.args.command;
          const state = sessionState(key);
          if (oweReminder(state, command)) {
            output.args.command = REMINDER + command;
          }
          return;
        }

        if (SEARCH_TOOLS.has(input.tool)) refuseFirstSearch(key, output?.args);
      },
    };
  },
};
