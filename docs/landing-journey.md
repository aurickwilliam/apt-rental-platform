# Landing journey (public `/`)

Scroll-driven route that connects the public landing page's chapters. It is decoration: it must never gate content, scrolling, or navigation.

## Where it lives

| Piece | File |
|---|---|
| Scene wrapper, measurement lifecycle | `apps/web/app/(main)/components/journey/JourneyScene.tsx` |
| SVG path, marker, scroll wiring | `apps/web/app/(main)/components/journey/JourneyPath.tsx` |
| Pure geometry and progress math | `apps/web/app/(main)/components/journey/journey-geometry.ts` |
| Tenant CTA markup | `apps/web/app/(main)/components/journey/JourneyCta.tsx` |
| CTA highlight latch/keyframes | `apps/web/app/(main)/components/journey/cta-highlight.ts`, `use-cta-highlight.ts` |
| Scoped styles | `apps/web/app/(main)/components/journey/journey.module.css` |
| Integration | `apps/web/app/(landing)/page.tsx` |
| Regression tests | `apps/web/lib/landing-journey.test.mjs` |

`app/about/journey-demo/` and `app/about/mobile-demo/` are development-only previews (`notFound()` in production). They are reference material, not a runtime dependency of the landing page: production modules must never import from them.

## Scene contract

`JourneyScene` wraps exactly the chapters the route describes, in document order:

1. Featured apartments (`data-journey-featured`)
2. Discover & Apply (`data-product-chapter="discover"`)
3. Live & Manage (`data-product-chapter="manage"`)
4. How It Works (`#how-it-works`)
5. The tenant CTA (`JourneyCta`, `data-journey-cta`)

Everything outside that wrapper (hero, owner CTA, app, team, FAQ, contact) is untouched by the journey.

The route is built from those real anchors. `JourneyScene` measures each anchor plus the intro heading and each chapter's copy/media columns, then hands the boxes to `buildJourneyGeometry`. Rules:

- Measure inside `requestAnimationFrame`, batched from one `ResizeObserver`, a capture-phase `load` listener, `document.fonts.ready`, and window `resize`. Streaming listings, captured images, font swaps, and viewport changes all settle through that single path.
- The featured section's existing bottom padding is subtracted so the path leaves from the stable listing content edge, not from an animating card.
- Never measure on scroll. `JourneyPath` caches the scene's document top/height/viewport from the same layout pass and reuses it every frame.
- `buildJourneyGeometry` returns `null` for unavailable or unsafe layouts (narrow width, non-finite boxes, insufficient side space, chapter gaps too tight, a curve that would touch text or media, no room to fade). Rendering nothing is a supported outcome.

The SVG is absolutely positioned behind the scene content (`z-index: 0`, content at `1`), `aria-hidden`, `focusable="false"`, and pointer-transparent. It can never intercept a click. The wrapper only removes the two competing chapter divider top borders (Featured and How It Works); their 1px layout space is retained.

## Scroll mapping and completion

`journeyScrollProgress(scrollY, sceneTop, sceneHeight, viewportHeight)` places the 72% reading line inside the scene:

```
progress = clamp01((scrollY + viewportHeight * 0.72 - sceneTop) / sceneHeight)
```

Progress is a Motion `MotionValue` seeded on layout, refreshed by a passive window `scroll` listener, and re-seeded after `pageshow`, `hashchange`, `popstate`, `scrollend`, and the first few post-layout frames. This replaces target-based scroll measurement, which lost the initial anchor position when a cross-route `/#contact` navigation applied its scroll before hydration. The seed also calls `scrollYProgress.dirty()`: Motion notifies derived values only on change, so a scene remounted at the same scroll position (reduced-motion toggle, StrictMode) would otherwise keep its path and marker at the start. Do not reintroduce per-frame `getBoundingClientRect` calls or target-measured scroll hooks.

Derived values stay on Motion transforms so native bindings own the DOM:

- `draw`: eased scroll → drawn arc length, so the visible stroke trails the marker.
- `pathOpacity`: fades over the last 128px of available travel before the CTA (clamped, smoothstep).
- `roofOpacity`: `1 - pathOpacity`, crossfading the navigation icon into the APT roof at the CTA.
- Marker position uses `getPointAtLength` on the rendered stroke; its angle is the forward tangent (`atan2` + 90°), so the icon stays upright and continuous on reverse traversal without a 0/360 seam.

The endpoint is the CTA heading's horizontal centre, one marker radius plus a 20px gap above it.

## CTA highlight

The first time progress reaches the fade end, the CTA plays one 800ms highlight: two minimal side accents fade/scale in and out, and the Browse button brightens slightly. A latch in component state plays it once; scrolling back 24px or more re-arms it. It is cancelled and skipped below 768px, under `prefers-reduced-motion`, the APT reduced-motion class, or the APT preference. The CTA itself is an ordinary `next/link` to `/browse` and stays functional and keyboard reachable in every state.

## Responsive, motion, and no-JavaScript behaviour

- At 767px and below the route, marker, and accents are not rendered (`display: none` plus the geometry's minimum width), keeping the 375px stack unchanged.
- Reduced motion (`prefers-reduced-motion` or `html.apt-reduce-motion`) hides the decoration entirely; content, order, and CTA are unaffected.
- With JavaScript disabled, `JourneyScene` renders only its children: the page reads exactly like the un-decorated landing page.
- Marker sizes: 32px desktop with enough side space, 22px for narrower desktop gutters, 20px below the desktop breakpoint.

## Accessibility

The route is presentational and excluded from the accessibility tree and tab order. No heading, link, or control changes meaning because of it, and the decorative accents are never the only signal for the CTA.

## Verifying

`pnpm --filter web test` runs `lib/landing-journey.test.mjs`, which covers geometry fitting, endpoint/heading alignment, fade distance, tangent continuity, hidden layouts, the scroll mapping, and the anchor/history listener contract without measuring per frame.

When changing the route, also check at 375, 768, 1024, 1280, 1440, and 1919px:

- the path clears text and images at every scroll position (no marker collisions),
- the path ends exactly above the CTA heading and reverses without residue,
- direct `/#contact` loads, back/forward, and resize settle correctly,
- dark mode, reduced motion, and no-JavaScript still read as the original page,
- no horizontal overflow and no console or hydration errors.

Temporary Playwright scripts and screenshots belong outside the repository.
