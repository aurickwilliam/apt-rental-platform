# Graphify merge-conflict audit

Audit of PR #217 against `origin/main` at `784d0a02` (2026-10-20).
Recommendations below require separate approval. This audit does not change
Git tracking, ignore rules, hooks, merge drivers, or CI.

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
- `.gitattributes` assigns `merge=graphify` only to the root `graph.json`.
  This clone has no `merge.graphify.driver` configuration. `graphify hook status`
  reports a partial merge-driver registration and no installed Git hooks.
  Git configuration and hooks are local, so a committed attribute alone does not
  install the driver for collaborators or GitHub. A JSON union driver also cannot
  regenerate the report, HTML, and manifest as one snapshot.
- Root `.gitignore` rules ignore only selected root caches/sidecars, not the
  four outputs. Nested `apps/mobile/graphify-out/` snapshots, caches, and labels,
  and `apps/web/graphify-out/manifest.json` are also tracked. Some old nested
  manifests contain machine-specific absolute paths. Adding ignore rules alone
  never untracks existing files.

## Dependency audit

| Consumer | Finding |
| --- | --- |
| `.github/workflows/ci.yml` | Runs installation, population-command unit tests, mobile lint/Jest, and web lint/typecheck/tests. No Graphify generation, validation, or output read. |
| `.github/workflows/codeql.yml` | JavaScript/TypeScript analysis; no Graphify-specific step. |
| `.github/workflows/opencode.yml` | Runs OpenCode on an explicit comment; no graph generation or graph-required gate. Agents can still follow the repository's Graphify guidance. |
| Root/app package scripts | No app build, runtime, test, or package script requires a Graphify output. |
| `.opencode/plugins/graphify.js` | Checks whether a local `graphify-out/graph.json` exists and conditionally adds a reminder. Missing output does not fail the plugin. It does not require Git tracking. |
| `.graphifyignore` | Excludes skill/agent directories from indexing; keep this source configuration. |
| `AGENTS.md`, `ARCHITECTURE.md`, implementation plans | Require graph-first navigation and `graphify update .` after source edits. These workflows need a usable local graph, not necessarily committed snapshots. Fresh-clone bootstrapping must be documented before untracking. |
| Git hooks / merge-driver config | No hooks installed in this clone; driver configuration missing. Other developers' local hooks cannot be audited from this clone. |

## Current merge procedure

1. Review and resolve application source conflicts first.
2. Restore all four generated files from one committed baseline (the feature
   branch's `HEAD`), not a mixture of branch snapshots. Never hand-merge their data.
3. Run `graphify update .` from the repository root against the merged working
   tree. This is the supported AST-only/no-API-cost command and retains existing
   semantic knowledge from the baseline.
4. Check that graph node/edge/community counts match the report and embedded HTML,
   and that the manifest's source hashes match the working tree. Stage all four
   outputs together only after validation.

The report's built-from commit remains the current feature `HEAD` until the
merge-resolution commit is created. That is expected for an uncommitted merge;
source hashes and cross-artifact checks verify the actual merged snapshot.
The installed extractor warns about partial parsing of
`packages/supabase/src/types.ts`; this is pre-existing, not a TypeScript build error.

## Recommended permanent strategy (approval required)

Keep generated graphs locally available, but stop versioning the four root
snapshots. No application/CI consumer requires them in Git. Before rollout,
agree on the bootstrap workflow and update the agent documentation so a fresh
clone does not assume an already present graph.

Exact minimal root-only change:

```gitignore
# Local generated knowledge graph (source configuration stays tracked)
/graphify-out/
```

Then, after approval, run from the repository root:

```sh
git rm --cached -- graphify-out/GRAPH_REPORT.md graphify-out/graph.html graphify-out/graph.json graphify-out/manifest.json
```

`--cached` preserves the local files. Keep `.graphifyignore`, the OpenCode plugin,
and the agent documentation tracked. Remove the now-unused root graph merge
attribute only as part of the separately approved tracking change.

For fresh clones, the supported no-key bootstrap is
`graphify extract . --code-only`, followed by `graphify update .` during normal
development. A code-only bootstrap does **not** recreate the semantic document
knowledge in the current snapshot. If that knowledge is required, distribute a
versioned main-branch snapshot as a downloadable artifact or document a full
Graphify extraction workflow before untracking. Pin the Graphify version used
for shared artifacts and record their source revision.

Nested outputs need their own approved cleanup. To ignore all generated graph
directories, use `**/graphify-out/` instead of the root-only rule, and explicitly
untrack the reviewed nested generated directories with `git rm -r --cached --
apps/mobile/graphify-out apps/web/graphify-out`. Preserve any curated labels or
other manually maintained knowledge in a tracked non-output location first.
Do not run a broad delete or silently remove nested team assets.

If the team requires committed snapshots, designate one serialized main-branch
refresh process: feature PRs change source only, and a single follow-up snapshot
PR regenerates all four files after source merges. Do not rely on `merge=ours`,
manual JSON merging, or a driver configured only on one developer's machine.
Any automation or CI change remains a separate approval item.

## Required CI status

The PR currently has merge conflicts on GitHub; its head has no `ci` run. GitHub
does not run `pull_request` workflows for merge-conflicting PRs. The workflow
subscribes to `pull_request` without path filters, so pushing an approved
conflict-free merge-resolution commit should trigger it through the synchronize
event. Local resolution alone cannot publish the check or change GitHub's merge
state. GitHub Actions availability, permissions, and any future base-branch
changes still apply. A successful Vercel status is not the required `ci` check.
