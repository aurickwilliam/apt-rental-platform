# Graphify merge-conflict audit

Audit refreshed against `origin/main` at `536bec64` (2026-10-20).
The approved resolution makes the four root Graphify snapshots local-only.
CI and application behavior do not depend on committing them. No GitHub merge,
commit, push, deployment, database operation or hook installation is part of this change.

## Why conflicts recur

- Both feature branches and main commit the same four repository-wide generated
  snapshots: `GRAPH_REPORT.md`, `graph.html`, `graph.json`, and `manifest.json`.
  Even unrelated source changes rewrite shared graph edges, community membership,
  report ordering, embedded HTML data, and manifest hashes.
- The compact `graph.json` is one line. Git cannot meaningfully line-merge
  independently regenerated graphs. A successful textual merge of the other
  files would not establish that they describe one coherent graph.
- Recent main history contains many separate `CHORE: Update graphify` commits.
  Concurrent snapshot regeneration is an existing team practice, not a runtime
  application dependency.
- Before this resolution, `.gitattributes` assigned `merge=graphify` only to the
  root `graph.json`. This clone had no `merge.graphify.driver` configuration.
  `graphify hook status` reported partial registration and no installed Git hooks.
  Git configuration and hooks are local, so a committed attribute alone does not
  install the driver for collaborators or GitHub. A JSON union driver also cannot
  regenerate the report, HTML, and manifest as one snapshot.
- Previously, root `.gitignore` rules ignored only selected root caches/sidecars, not the
  four outputs. Nested `apps/mobile/graphify-out/` snapshots, caches, and labels,
  and `apps/web/graphify-out/manifest.json` are also tracked. Some old nested
  manifests contain machine-specific absolute paths. Adding ignore rules alone
  never untracks existing files.

## Dependency audit

| Consumer | Finding |
| --- | --- |
| `.github/workflows/ci.yml` | Runs installation, population-command tests, embedded billing tests, mobile lint/Jest, and web lint/typecheck/tests. No Graphify generation, validation, or output read. |
| `.github/workflows/codeql.yml` | JavaScript/TypeScript analysis; no Graphify-specific step. |
| `.github/workflows/opencode.yml` | Runs OpenCode on an explicit comment; no graph generation or graph-required gate. Agents can still follow the repository's Graphify guidance. |
| Root/app package scripts | No app build, runtime, test, or package script requires a Graphify output. |
| `.opencode/plugins/graphify.js` | Checks whether a local `graphify-out/graph.json` exists and conditionally adds a reminder. Missing output does not fail the plugin. It does not require Git tracking. |
| `.graphifyignore` | Excludes skill/agent directories from indexing; keep this source configuration. |
| `AGENTS.md`, `ARCHITECTURE.md`, implementation plans | Require graph-first navigation and updates after source edits. These need a usable local graph, not committed snapshots. AGENTS.md now documents no-key fresh-clone bootstrapping and branch-switch refreshes. |
| Git hooks / merge-driver config | No hooks installed in this clone; driver configuration missing. Other developers' local hooks cannot be audited from this clone. |

## Current merge procedure

1. Fetch `origin/main` and start a local `git merge --no-commit --no-ff origin/main`
   from a clean feature working tree. Stop before committing or pushing.
2. Resolve `packages/utils/src/index.ts` by keeping the feature's five chat
   attachment exports and main's finance exports, `nextUnpaidRentPeriod` and
   tenancy-bill exports. Preserve all other exports and automatic source merges.
3. Restore the four generated working-tree files from one coherent baseline
   (feature `HEAD`), never by hand-merging JSON/HTML/report data.
4. Ignore `/graphify-out/`, then run `git rm -r --cached -- graphify-out/` from
   the root. This resolves their index conflicts without deleting local files.
5. Remove the obsolete `.gitattributes` entry (it was the file's only entry).
   Keep `.graphifyignore` and the OpenCode plugin unchanged and tracked.
6. Refresh with `graphify update .`, query the ignored local graph, and verify
   that no root generated file remains tracked. The four staged deletions are
   intentional until the user commits; regeneration must not add modifications
   or untracked root graph files to Git status.

The report's built-from commit remains the current feature `HEAD` until the
merge-resolution commit is created. That is expected for an uncommitted merge;
source hashes and cross-artifact checks verify the actual merged snapshot.
The installed extractor warns about partial parsing of
`packages/supabase/src/types.ts`; this is pre-existing, not a TypeScript build error.

## Local-only output and team rollout

Keep generated root graphs locally available, but do not version the snapshots.
No application/CI consumer requires them in Git. Agent documentation now includes
the bootstrap workflow so a fresh clone does not assume an existing graph.

Exact minimal root-only change:

```gitignore
# Local generated knowledge graph (source configuration stays tracked)
/graphify-out/
```

The approved one-time untracking command, from the root, is:

```sh
git rm -r --cached -- graphify-out/
```

`--cached` preserves the local files. Keep `.graphifyignore`, the OpenCode plugin,
and the agent documentation tracked. The unused root graph merge attribute is
removed with this tracking change; no local driver or hooks need installing.

For fresh clones, the supported no-key bootstrap is
`graphify extract . --code-only`, followed by `graphify update .` during normal
development. A code-only bootstrap does **not** recreate the semantic document
knowledge in the current snapshot. Existing local semantic knowledge is preserved
when updating it; a fresh clone can use the Graphify skill for full semantic
extraction if needed. If the team later wants shared semantic snapshots, publish
downloadable artifacts outside source PRs and record the source revision and
Graphify version. No such artifact pipeline is currently required or installed.

After this change reaches main, contributors should sync their branches, stop
committing generated root outputs, and refresh locally after source/branch changes.
Back up the local folder outside the repo before switching to older branches
that still track it: checkout/pull can remove a formerly tracked working-tree
file even though the new ignore rule exists. Regenerate if needed. Long-lived
branches may see a final modify/delete conflict; keep the root files untracked
and preserve/regenerate the local copies rather than resurrecting snapshots.
Do not use `git add -f` or auto-commit hooks for the ignored outputs.

Nested outputs need their own approved cleanup. To ignore all generated graph
directories, use `**/graphify-out/` instead of the root-only rule, and explicitly
untrack the reviewed nested generated directories with `git rm -r --cached --
apps/mobile/graphify-out apps/web/graphify-out`. Preserve any curated labels or
other manually maintained knowledge in a tracked non-output location first.
Do not run a broad delete or silently remove nested team assets.

Do not rely on `merge=ours`, manual JSON merging, or a driver configured only on
one developer's machine. Any future artifact automation or CI changes need their
own review; the current required CI never consumes root graph outputs.

## Required CI status

Local conflict resolution cannot change the remote PR until the user commits
and pushes. GitHub does not run `pull_request` workflows for merge-conflicting PRs. The workflow
subscribes to `pull_request` without path filters, so pushing an approved
conflict-free merge-resolution commit should trigger it through the synchronize
event. Local resolution alone cannot publish the check or change GitHub's merge
state. GitHub Actions availability, permissions, and any future base-branch
changes still apply. A successful Vercel status is not the required `ci` check.
