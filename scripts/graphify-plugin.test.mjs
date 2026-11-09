// Behavioral test for .opencode/plugins/graphify.js.
// Run from the repo root: node scripts/graphify-plugin.test.mjs
//
// Drives the plugin's OpenCode 2 "execute.before" hook with synthetic events.
// Two registrations share the module's session state (a globalThis map) the
// way two loaded plugin copies do, and the second callback sees the first
// one's rewritten command, matching the plugin-contract rule that later same-
// hook callbacks observe earlier callbacks' changes.
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import plugin from "../.opencode/plugins/graphify.js";

const hooks = [];
const pluginContext = () => ({
  location: { directory: fileURLToPath(new URL("..", import.meta.url)) },
  tool: { hook: (name, callback) => hooks.push(callback) },
});
await plugin.setup(pluginContext());
await plugin.setup(pluginContext()); // a second loaded copy shares that state
assert.equal(hooks.length, 2, "each loaded copy registers its hook");

// Run both copies in order; a thrown refusal aborts the call like a tool
// error, and later copies never see this event again.
const run = async (event) => {
  for (const hook of hooks) {
    try {
      await hook(event);
    } catch (error) {
      return error;
    }
  }
  return null;
};

const shell = (sessionID, command) => ({ tool: "shell", sessionID, input: { command } });
const search = (sessionID, tool, pattern) => ({ tool, sessionID, input: { pattern } });
const state = (sessionID) => (globalThis.__graphifySessions ??= new Map()).get(sessionID);

// A fresh session is reminded once per command, even with two copies loaded.
const firstCommand = shell("a", "pnpm web");
assert.equal(await run(firstCommand), null);
assert.ok(firstCommand.input.command.startsWith('echo "[graphify]'), "the first shell gets the reminder");
assert.ok(
  !firstCommand.input.command.startsWith('echo "[graphify]echo "[graphify]'),
  "a second copy must never add another reminder to the same command",
);
assert.equal(state("a").usedGraphify, false, "the reminder prose must not record a graphify use");

const secondCommand = shell("a", "pnpm build");
await run(secondCommand);
assert.ok(secondCommand.input.command.startsWith('echo "[graphify]'), "each distinct shell gets its reminder");

// A real invocation is never reminded, records the use, and stops reminders.
const invoked = shell("a", "graphify query how does application readiness work");
assert.equal(await run(invoked), null);
assert.ok(!invoked.input.command.startsWith('echo "[graphify]'), "a graphify invocation is not reminded");
assert.equal(state("a").usedGraphify, true, "a real invocation records the use");

const afterUse = shell("a", "pnpm lint");
await run(afterUse);
assert.ok(!afterUse.input.command.startsWith('echo "[graphify]'), "reminders stop after graphify ran");
assert.equal(await run(search("a", "grep", "useMemo")), null, "searches in a used session always run");

// The reminder count is capped at three per session.
for (const command of ["pnpm test", "pnpm --filter web dev", "pnpm --filter mobile lint", "pnpm typecheck"]) {
  await run(shell("b", command));
}
assert.equal(state("b").reminders, 3, "the reminder count is capped at three per session");

// A quoted graphify mention is prose, not an invocation.
const quotedMention = shell("e", 'grep -rn "graphify hook status" docs');
await run(quotedMention);
assert.ok(quotedMention.input.command.startsWith('echo "[graphify]'), "the quoted mention still gets its reminder");
assert.equal(state("e").usedGraphify, false, "a quoted graphify mention must not record use");
assert.ok((await run(search("e", "grep", "useMemo"))) instanceof Error, "the session keeps its one refusal");

// The refusal is once per session and explains the fix.
const refused = await run(search("c", "grep", "useMemo"));
assert.ok(refused instanceof Error, "the first raw search in a fresh session is refused");
assert.ok(refused.message.includes("graphify query"), "the refusal points at graphify query");
assert.equal(await run(search("c", "glob", "docs/**")), null, "the refusal is once per session");

// Searches about graphify are always allowed and never latch anything.
assert.equal(await run(search("d", "grep", "graphify hook status")), null, "searches about graphify are always allowed");
assert.equal(state("d").usedGraphify, false, "an exempt search must not record use");
assert.equal(state("d").refused, false, "an exempt search must not consume the one refusal");
assert.ok((await run(search("d", "grep", "useMemo"))) instanceof Error, "a later raw search still gets the refusal");
console.log("graphify plugin behavior OK");
