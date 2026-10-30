# Local journey-path study — not production integration

Preview: `http://localhost:3000/about/journey-demo` with `pnpm --filter web dev`.
Only `NODE_ENV=development` can render this page. Other environments call
`notFound()` before importing the demo. This is an availability guard, **not a Git
exclusion or proof that the route entry is absent from the production build**.

## Selective-staging exclusion manifest

Keep **all of `apps/web/app/about/journey-demo/`** out of the intended production
landing commit. No ignore rules have been added. This includes these twelve files:

- `page.tsx`
- `JourneyDemo.tsx`
- `HeroScaffold.tsx`
- `FeaturedScaffold.tsx`
- `JourneyScene.tsx`
- `JourneyPath.tsx`
- `journey-geometry.ts`
- `journey-demo.module.css`
- `journey-path.test.mjs`
- `cta-highlight.ts`
- `use-cta-highlight.ts`
- `README.md`

Keep the existing `apps/web/app/about/mobile-demo/` preview excluded separately.
Do not delete either preview or exclude production-required animated components.

## Geometry and fidelity

The study uses the actual container (`max-w-7xl px-6`), unmodified presentation-only
ProductShowcaseSection, DiscoverShowcase, LiveManageShowcase, RentalStepsSection and
OwnerCtaSection. Their assets, layout rules and motion controllers are untouched.

The Hero and listing strip are static references. Listing cards have approximate
carousel footprints, repeated local artwork and explicit fixture labels, not live
names, availability, prices or apartment links. The header is a local preview
header, not AppNavbar. No download lookup, listing query or session hook is imported
by the prototype. A small notice and different fixture wrapping change absolute
page positions. Sections after the owner CTA are intentionally not reproduced.
**This scaffold does not prove exact production-page alignment.**

The new tenant CTA is a compact, unboxed ending after How It Works and before the
unchanged owner CTA. Its existing `/browse` destination is deliberately not
prefetched. No production page, navbar or Footer links to the preview.

## One path, one scroll controller

ResizeObserver batches measurements of the root, listing strip, two whole product
articles, their stable copy/media columns, workflow panel and CTA heading into one
requested animation frame. Fonts
settling also schedules a measurement. Animated child transforms are never used as
anchors. Geometry does not measure sections on scroll. Unchanged measurements reuse
the same state; the observer and pending frame are cleaned up on unmount. A scoped
window-resize listener also refreshes the completion range for height-only resizes;
it is removed on unmount and never measures in a scroll handler.

### Targeted curve alternatives reviewed in Chromium

The approved route, navigation badge and completion interaction are retained. This
geometry-only comparison targets Featured → Discover, Manage → How It Works and
Workflow → CTA. Both variants were rendered at 375, 768, 1024, 1280, 1440 and 1919px,
at equivalent measured scroll positions, with intermediate, fully drawn transition
and full-route screenshots outside the repository:

- **A — Gentle S-curves:** keeps the old transition endpoints and changes the three
  targeted cubic handles from 50% to 75% of vertical travel. It is smooth but makes
  the already shallow final curve look flatter; the opening turn still starts at
  the old corner. It was not selected.
- **B — Restrained architectural shoulders (selected):** begins the opening turn
  100px earlier in the right gutter, moving inward by at most 48px before the old
  turn boundary. Its diagonal join has matching tangents. The Manage return uses
  balanced 65% vertical handles instead of a long diagonal-looking 50% sweep.
  The final gutter exit is rounded before a shorter lateral approach; its last
  control point is directly above the measured destination.

The selected desktop route uses ten cubics (four on tablet), but still the same
eight timing phases (three on tablet). Extra pieces split existing entry/exit
shoulders, not additional lateral journeys or loops. Joins preserve forward tangent
direction (G1 continuity), including diagonal and horizontal joins; tangent speed
need not match between separately parameterized cubic pieces. Discover's reading
rail, the approved Discover → Manage sidestep, and Manage's reading rail are unchanged.

| Transition | Whitespace used | Reading purpose |
|---|---|---|
| Featured → Discover | Begin rounding in the measured right-side intro clearance, then above Discover's copy into its 64px column gap | Lead inward gradually rather than waiting for the old turn boundary; arrive beside the heading |
| Discover → Manage | Short gap between the product rows, beginning/ending inside their column corridors | Follow the alternating composition without a full-width sweep |
| Manage → How It Works | Below Manage's copy, left of the phones, with balanced S curvature into the outer gutter above the workflow | Retain clear spacing from devices and panel; no new full-width crossing or border tracing |
| Workflow → CTA | Rounded exit from the left gutter and a shallow cubic beneath the panel, with a vertical destination tangent | Resolve above the measured heading rather than ending a diagonal at it; then let the route disappear |

At 1440px the opening shoulder begins at scene Y≈654.70 instead of 754.70; the
old turn boundary is now X=1136 rather than 1184. The Manage return's endpoints
remain `(545.91, 1962.03)` → `(-32, 2216.36)`; the 165.31px vertical handles replace
127.16px handles. No safe corridor permits a materially shorter total sideways
crossing there without moving content or changing the workflow gutter.

The final shoulder begins at `(-32, 2992.48)` and rounds to `(16, 3064.48)` before
the final cubic ends at the unchanged `(616, 3116.48)`. Thus the final lateral
cubic spans 600px rather than 648px. Roomy gutters can start rounding 48px before
the workflow bottom; compact gutters first clear it by the badge radius plus 1px,
then use a smaller 16px shoulder. The vertical descent preceding that shoulder is
split with de Casteljau so its earlier position/parameterization is retained.

The workflow-to-heading space is inherently shallow: at 1440px only 52px separate
the under-panel corridor and destination. This change softens the shoulders and
uses an above-destination tangent; it does not claim a tall sweeping arrival curve.
Creating one would cross the panel or require unauthorized layout/endpoint changes.

Copy/media bounds are measured only on layout changes. The introduction's bottom
is derived from the stable product-row margin and its width from `offsetWidth`,
never from the reveal's animated transform. Stable columns are also observed:
fluid typography may resize copy while an article keeps its media-led height.

A roomy desktop retains the 32px badge. A narrow desktop retains 22px, centered in
its 24px gutter to leave 1px on each side; tablet retains 20px with 2px clearance.
No content is narrowed or moved. Crowded or invalid
geometry hides the decoration rather than crossing content. No additional spacer
or sticky/pinned section is introduced. Below 1024px the stacked layout has no safe
inner corridor: it uses a modest opening turn into the left gutter, a quiet descent
beside all content and a shorter CTA curve. It does not inherit desktop crossings.
Below 768px neither path nor badge is mounted. Invalid/crowded column geometry and
sampled badge/content collisions fail closed rather than drawing over content.

A 64-samples-per-phase table maps section position to normalized SVG drawing length.
**The approved scroll-input table is unchanged**, including its local 70% vertical /
30% arc-distance blend, all phase boundaries and all completion thresholds. The old
cubics remain solely as pure timing references; they are never drawn or followed
by the marker. Revised geometric samples recalculate only the arc-length outputs.
Compound shoulders occupy the existing phases, not extra scroll intervals. All of
this computation runs on layout changes, not scrolling. During each copy block
the route stays in its measured corridor. Each visible cubic is also independently
sampled for collision rejection so short shoulders cannot slip between timing samples.

The short Discover/Manage transition receives the measured chapter gap plus 32px
on either side (144px of scroll for the current 80px gap). The final arrival starts
its scroll interval 48px before the workflow's bottom. These bounded intervals
smooth lateral travel; they never hold, snap or take control of scrolling. The
marker stays within 96px of the reading reference in the pure geometry checks.
Motion's single `useScroll` measures `start 0.72` to `end 0.72`: 72% of viewport height
is the reading reference, not an exactly pinned tip. `useTransform` consumes the
table directly. Traversal and completion have no playback clock, spring, per-scroll
React state or segment handoff. Restored/fragment positions seed the scroll value
before paint. The optional CTA finishing cue described below is a separate,
explicitly completion-triggered 800ms animation; it never controls the route.

The SVG is behind content, aria-hidden, unfocusable and pointer-transparent. Both
strokes use the existing theme-aware `--brand` blue. The active route is 1.5px at
75% opacity (previously 2.5px at full opacity), and the inactive route is only 7%
(previously 12%). The circular badge remains solid blue and visually leads the line.
No glow, gradient or numbered timeline is introduced.

## Navigation marker and destination roof

Travel uses the installed `@tabler/icons-react` **IconNavigationFilled**: a white,
up-facing, filled navigation pointer inside the existing blue circular badge.
Tabler is APT's approved icon library; no Lucide dependency or proprietary mapping
artwork is added. The pointer is 62% of the badge diameter. The 32px roomy-desktop,
22px narrow-gutter and 20px tablet badge sizes, white outline and minimal shadow
are unchanged. The outer badge stays upright and only translates.

Only the inner navigation group rotates. `journeyMarkerAngle` samples the actual
active path at `distance ± 3` SVG units (clamped at either endpoint), computes
`atan2(dy, dx)`, then adds 90 degrees for the icon's native up-facing orientation.
The strictly downward route keeps the result continuously within 90–270 degrees,
so there is no 0/360 seam, full spin or history-dependent angle unwrapping.
Reverse scrolling retraces the same forward-route bearing instead of making a
sudden 180-degree velocity flip. Orientation is a deterministic function of route
progress, not of the last scroll direction; it freezes immediately when scrolling
stops. There is no smoothing delay or spring lag.

At arrival the arrow stays at the measured endpoint. Through the existing
completion interval, its opacity is the **same `pathOpacity` Motion value** as the
path strokes. A sibling roof layer uses `1 - pathOpacity`. This is a crossfade,
not a shape morph: no icon rotation, scale burst or badge movement is added during
completion. At the end, path and arrow opacity are 0, roof opacity is 1, and the
blue circle remains at opacity 1. Reversing that same interval restores the arrow
and route before traversal resumes.

The roof layer reuses unchanged `/logo/logo.svg`, the approved white APT roof
symbol without a wordmark. SVG clipping makes its blue square background circular;
the asset's proportions and upright orientation are preserved.

Both drawing and marker use the same effective `draw` Motion value, after the local
70/30 pacing remap. The existing marker-positioning mechanism is retained.
`useMotionValueEvent(draw, "change", ...)` samples the actual
active `SVGPathElement` with `getPointAtLength(cachedTotalLength * draw)`, then sets
the marker group's translation directly. No second trajectory, React state update,
playback clock or spring is involved. `getTotalLength()` is cached once per geometry
change; section layout is not read in that update callback. Each traversal update
now uses three point lookups: one position plus two tangent samples. During the
completion crossfade `draw` is clamped at 1, so neither position nor angle lookups
run. The badge and roof never rotate.

On initial mount or re-enabling motion, the SVG waits for Motion's own existing
post-render pass before becoming visible. This prevents a one-frame travel-icon
flash at an already completed CTA. The queued reveal is cancelled on cleanup; it
does not create a timer, playback clock or repeating animation. Do not manually
overwrite derived Motion values or their opacity styles: doing so can detach
native scroll bindings. Live opacity remains owned by Motion throughout scrolling.

## Prototype-only divider removal

Two visible decorative gray rules existed: the top border on the product chapter
section (`section[aria-labelledby="thriving-title"]`, after Featured Apartments),
and the top border on `#how-it-works` (after Live & Manage). The prototype's local
`.referenceContent` scope makes only those border colors transparent. Retaining
their 1px layout space preserves every section anchor, existing route coordinate
and completion threshold exactly. This is not a blanket border reset.

Featured Apartments, the individual Discover/Manage articles and the tenant CTA
already had no section rules. Card/interface borders, the How It Works panel,
its process arrows and internal separators, semantic landmarks and the navbar's
functional bottom border remain unchanged. No production component or shared CSS
was edited, and no replacement separator was introduced.

## One-shot CTA side-accent finish

Three subtle treatments were compared at actual completion in Chromium: short
straight strokes, taller gently curved strokes, and full-group minimal straight
strokes with a soft button pulse. **The third is selected.** Short strokes mostly
highlighted the heading rather than the full group; curved sides felt more like
enclosing brackets. Straight 1.5px rounded side accents keep the roof, heading,
supporting sentence and button visually together without a box, panel, top/bottom
rule, glow or additional logo artwork.

The existing CTA section becomes the positioning parent, without changing its
spacing, dimensions or children’s typography. An aria-hidden, pointer-transparent
absolute overlay is at most 800px wide, with at least 24px inset from the section
edges. Its vertical placement accounts for the existing 20/22/32px badge diameter
so it spans the roof through the button. The strokes use the existing `--brand`
token, round caps and a peak opacity of 0.58. Only their wrapper fades and grows
from 94% to 100% height; content and the roof never move, dim or scale. The button
receives one restrained 4.5% brightness pulse, not a traveling shine or glow.

`useCtaHighlight` consumes the **existing** `scrollYProgress` Motion value from
`JourneyPath`; there is no second scroll controller, observer, scroll handler,
per-scroll React state update or added section measurement. The pure
`ctaHighlightTransition` latch starts armed and fires only at
`geometry.completion.fadeEndProgress`, after the route fade and roof crossfade
finish. A post-render callback lets Motion render that completed state before
starting the cue. An eligible mount restored at completion can play once, too.

The two coordinated native Web Animations last **800ms**, one iteration, with
`fill: "none"`; they leave no held visual state. There is no repeating timer or
autoplay loop. The cue is deliberately time-based, while the path and roof fade
remain fully scroll-controlled. Idle progress updates cannot replay it. Reversing
below completion immediately cancels both effects. Re-arming requires moving
24px back from fade-end, clamped to arrival for unusually short fade intervals;
small threshold oscillations therefore do not cause repeated flashes. Returning
to completion after re-arming plays once again. Layout-effect cleanup cancels
queued starts and active animations; geometry re-renders retain the latch.

Below 768px, with OS/APT reduced motion, or with JavaScript unavailable, the cue
is hidden/inactive. A live reduced-motion change also cancels an active cue. The
CTA stays readable and keyboard-operable in every state. No focus is moved, no
pointer target is covered, and no page height or scroll range is added.

The finish-only comparison and verification artifacts are outside the repository
at `C:\Users\Aaron23\AppData\Local\Temp\opencode\journey-cta-accent-sol\`:
`variants.png` shows all three treatments; `cta-stages.png` shows before, peak,
rest, replay, dark, tablet, reduced-motion, mobile and keyboard-focus states.
Individual captures retain their state and viewport names. `accent-verification.json`
records first-completion-only starts, 800ms/one-iteration timing, idle stability,
hysteresis, reset/replay, reverse cancellation, alignment, content clearance,
unchanged dimensions/path, reduced motion, no-JavaScript and keyboard checks.
The external `baseline-source/` backs up the entire approved prototype before this
finish experiment; preserve unrelated uncommitted landing work when rolling back.

## Centered arrival and scroll-only completion

Only the final approach endpoint changes. Its destination comes from the actual
CTA heading rectangle already measured by `JourneyScene`:

- center X = `(heading.left + heading.right) / 2`;
- center Y = `heading.top - markerDiameter / 2 - 20`.

The 20px gap is measured from the bottom of the circular badge, not its center.
No CTA markup, copy, button, styles, spacer or owner-section layout was changed.
Wrapping and viewport changes remeasure the same heading. The earlier seven desktop
segments (two on tablet), their sampled points and chapter-local scroll inputs are
protected by exact pre-change regression hashes in the focused tests.

Traversal still uses the existing interpolation table. It reaches `draw = 1` at
`completion.arrivalProgress` and clamps there: the marker stays at the endpoint
relative to the heading while the page continues scrolling normally. It is not
sticky or fixed to the viewport.

A following 128px scroll interval controls only a new `motion.g` containing both
the active stroke and inactive track. `journeyPathOpacity` uses scroll progress
with a clamped smoothstep, `1 - t²(3 - 2t)`: fully visible at arrival, about half
visible midway, exactly zero at completion. The outer badge is a separate sibling
and never receives this opacity; only its two icon layers crossfade as described
above. The path remains mounted and measurable throughout.
No timer, spring, autoplay, removal/recreation or per-frame React state is involved.

The range is independent of SVG length. It is capped by the remaining natural
scroll travel (with 8px spare), never by adding page height. A 1440×2200 browser
check shortened it to 63.09px and still completed normally. An unreachable arrival
with less than 1px left fails closed, like other invalid geometry.

On the tested viewports, raw scene progress thresholds are:

| Viewport width | Arrive / start fading | Fully faded | Scroll interval |
|---|---:|---:|---:|
| 768px | 95.17% | 97.83% | 128px |
| 1024px | 92.71% | 96.64% | 128px |
| 1280px | 92.83% | 96.64% | 128px |
| 1440 / 1919px | 92.68% | 96.49% | 128px |

These are measured scene coordinates, not a global rescaling of the earlier story.
Scrolling upward reverses the fade with the marker still at the endpoint; below
the arrival threshold the same `draw` value retracts the stroke and marker together.
The same scroll position produces the same opacity and marker position, including
when motion is re-enabled while already at completion.

Below 768px the line is omitted without reducing content width. Both OS reduced
motion and the existing APT preference omit both path and marker entirely. CSS also hides them while
preferences settle. The CTA and normal scrolling remain usable. With JavaScript
disabled, there is no path; a preview-scoped noscript rule exposes shared reveal
content, and the existing showcase static fallbacks remain in effect.

## Backend boundary

Prototype components contain no requests or backend imports. Local image
optimization is not a backend data request. The route still inherits the existing
root layout, providers and middleware; an already-authenticated browser may trigger
their existing session checks. They are not bypassed or modified for this preview.
Network verification must distinguish those inherited checks from prototype calls,
and use a fresh signed-out context to establish a no-data-request review baseline.

## Checks

```powershell
pnpm --filter web exec node --experimental-strip-types --test app/about/journey-demo/journey-path.test.mjs
pnpm --filter web test
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web build
```

Verify the production route returns 404 and does not render `data-journey-demo`.
Inspect the build manifest separately: a guarded route entry may still exist. The
Git exclusion above is mandatory regardless of the production HTTP result.

## Local review results

Chromium checks cover 375, 768, 1024, 1280, 1440 and 1919px. At each visible-path
width, 101 dense progress samples plus 0/25/50/75/100% screenshots and reverse states
were captured. Marker and stroke positions agreed exactly (0 user units; under
0.00007px on screen), chord excess stayed below 0.001px, reverse values match, and
the line stops when scrolling stops. A 1,001-sample clearance sweep against real
text ranges, media and controls found no collisions: at least 2px of badge clearance
at 768px, 15.9px at 1024/1280px and 11.8px at 1440/1919px. The 101 live scroll
checkpoints per visible width also check the current marker against actual text,
images and controls. Arrival leaves 20px above the CTA heading. Separate
768/1440px dark-mode checks also preserve exact sync and content clearance.
Actual SVG samples clear the listing strip, chapter rectangles, introduction,
workflow panel and CTA. Anchor-measurement counts do not increase during scrolling.
During a scroll-only window, `getTotalLength()` ran 0 times, `getPointAtLength()`
ran 96 times (32 position updates × 3 point samples), and section layout/observer
reads stayed at 0. No horizontal
overflow, hydration/page errors or external browser requests were observed in fresh
signed-out contexts. Observed initial page layout shift stayed below 0.0005 across
the broader captures; a separate forward/reverse completion-only window measured
zero layout shifts at every visible-path width. The absolute SVG does not
participate in page layout. Live OS/APT motion changes restore the current draw and
completion state. Thirty animation-frame samples across each of seven resizes
(including unchanged container width and height-only changes) found zero
marker/stroke error and no reset to the start.

The dense traversal sweep also found 0 degrees of error between the rendered
arrow and the actual path's sampled bearing. Two-pixel scrolling steps through
the revised final approach changed its bearing by at most 12.2 degrees across the
tested widths; reverse checkpoints reproduced the exact angle, position and icon
opacities. Unit-distance samples of the actual SVG stayed downward and cleared the
entire workflow panel, including its lower-left corner. The previously approved
initial-reveal implementation is unchanged.
The completion checks verify complementary icon opacities, frozen arrival angles,
reverse crossfades and complete disappearance of both the arrow and path.

The current curve review confirms identical section positions/heights and arrival/
completion attributes at every visible-path width. Only the authorized path geometry
and arc-length outputs changed; the complete input table and completion fields have
baseline-hash regression guards. The divider CSS, shared sections, marker component
and layout-measurement component were not edited during this refinement.

Final alignment measurements (heading center / marker center, in screen pixels):

| Width | Heading X | Marker X | Error | Badge-bottom gap |
|---|---:|---:|---:|---:|
| 768 | 383.9922 | 383.9900 | 0.0022px | 20.0020px |
| 1024 | 512 | 512 | 0px | 19.9988px |
| 1280 | 640 | 640 | 0px | 19.9988px |
| 1440 | 720 | 720 | 0px | 20.0044px |
| 1919 | 959.5 | 959.5 | 0px | 20.0044px |

At 375px both decorations remain absent. A temporary browser-only 260px heading
width tested multiple wrapped lines at 1024px: 0px alignment error, 19.9988px gap.
Completion checks also prove stationary endpoint transforms through forward and
reverse fades, no drift after a 900ms pause, continuity across the arrival boundary,
unchanged path/marker DOM nodes, both stroke opacities reaching zero, and marker
opacity remaining 1. During fade-only scrolling all four instrumentation counts
were zero: length lookups, point lookups, section measurements and observer callbacks.

The pure reading-interval tests retain the original 96px overall bound and keep the
marker in each chapter's column corridor. Protected commands and samples for both
reading rails and the Discover → Manage sidestep match the pre-refinement hashes.
These are geometric associations, not a claim that the marker measures or enforces
an individual visitor's reading speed.

Shared chapter/workflow dimensions match the production baseline at the five
visible-path widths; that does not remove the scaffold limitations above. Mobile,
OS/APT reduced motion and no-JavaScript captures retain the CTA without a path.
Keyboard activation of the CTA reaches `/browse`.

The tall workflow still needs an outer lane: it has no clear internal route around
all four stages. Tablet deliberately stays quieter than desktop, and this scaffold
still uses illustrative listings rather than real-data geometry. The arrow follows
the route's destination bearing when scrubbing backward, not scroll velocity. Rapid
scrolling scrubs orientation immediately rather than adding delayed smoothing.
These are deliberate limitations, not reasons to resize protected content or
duplicate the process arrows.

The production build **does include** `/about/journey-demo/page` in its route manifest.
Its HTTP response was checked under `next start`: **404**, with no demo or SVG markup.
It is not build-excluded. All twelve prototype files must therefore remain out of the
future production commit even though the environment guard makes the route unavailable.

Screenshots, baseline hashes, geometry comparisons and browser verification reports
are outside the repository in
`C:\Users\Aaron23\AppData\Local\Temp\opencode\journey-curves-sol\`.
`final-comparison-mid.png` and `final-comparison-drawn.png` show all three targeted
transitions: baseline left, gentle-S candidate A middle, selected architectural B
right. Individual screenshots use `baseline-`, `candidate-A-`, `candidate-B-` and
`selected-`, followed by transition (`first`, `manage`, `final`), state (`mid`,
`drawn`) and viewport. `selected-complete-*` captures confirm the completed roof-only
state. Full-route images, dark/reduced-motion/resize captures and JSON reports are
beside them. `curve-verification.json` records unchanged layout/thresholds, panel
clearance, fine-scroll rotation and exact reverse checks. Other JSON reports cover
completion, accessibility, resize frames, performance and protected file hashes.
The previous navigation/divider review remains in `journey-navigation-sol`; the
older route and roof-only studies remain in `journey-guided-sol` and
`journey-arrival-sol`. `baseline-source/` preserves all ten approved prototype
files from before this geometry-only experiment; rejecting
it must not delete or restore unrelated landing work. No automatic rollback is
performed.
The regular web suite passed 967 tests; the separate local prototype suite passed
35 tests, including forward tangent continuity, dense panel-corner clearance,
no new lateral loops, unchanged input/completion hashes, protected earlier rails,
navigation bearing, reverse orientation, complementary icon layers, completion
visibility, prototype-only divider overrides and safe initial reveal. The added
finish tests cover completion-only triggering, idle stability, reverse cancellation,
reset/replay hysteresis, finite keyframes and mobile/reduced-motion presentation.
Web lint, TypeScript and production build checks passed for the refinement; see the
local verification reports. Graphify is refreshed locally; generated graph output
remains untracked and outside the preview's future commit boundary.

Future production integration would need an approved story wrapper/anchor contract,
real-data geometry checks and authorization for the tenant CTA placement. None of
those changes has been made to the production landing route.
