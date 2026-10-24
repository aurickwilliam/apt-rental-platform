# Mobile review prompt: behavior and testing

The tenant Rentals screen offers the newest eligible, unreviewed stay from its ten most recent tenancies. The apartment must still be visible and not deleted. Eligibility matches web: three calendar months of stay, or the lease end date reached. The database still checks every review submission.

The HeroUI Native prompt follows the mobile theme. Write a Review opens the existing apartment Ratings & Reviews screen; its review button opens the existing form. Maybe later, the close button, Android Back and backdrop dismissal remember that the prompt was seen. Only one offer is shown per account-keyed gate mount. It never opens on other tabs, pushed apartment/payment routes or while the app is in the background.

Dismissals are local to this app installation and scoped to the Auth account and tenancy. Signing out preserves them. Web's localStorage flag is separate. Storage failure can cause a prompt to return on a later visit, but does not prevent dismissal now.

## Reset one prompt in a development build

Open the connected app's **React Native DevTools Console**, then run:

```js
await aptResetReviewUnlock("AUTH_USER_ID", "TENANCY_ID");
```

Use the account's **Auth user ID** (`users.user_id`), not its internal profile ID (`users.id`). Use the exact tenancy ID for the stay you want to test. Then reload the app from the developer menu and open tenant Rentals. Reloading clears the current mount's in-memory dismissal and query cache; signing out or clearing all app storage is unnecessary.

The helper exists only when `__DEV__` is true. It removes exactly one AsyncStorage key, `apt-review-unlock:v1:{authUserId}:{tenancyId}`. It does not alter login, other device preferences, reviews or database records. There is no production reset button. The stay must still be eligible and unreviewed: resetting dismissal does not undo an already-submitted review.

## Verification

Run focused checks without loading environment files:

```powershell
$env:EXPO_NO_DOTENV = "1"
pnpm --filter mobile exec jest --runInBand reviewEligibility reviewUnlock useReviewUnlock ReviewUnlockDialog ReviewUnlockGate useSubmitReview portal-layout EarningsSummaryCard
pnpm --filter mobile lint
pnpm --filter mobile typecheck
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
```

Tests cover date boundaries/month ends, visibility, reviewed and dismissed stays, account-scoped persistence and targeted reset, late requests, duplicate actions, navigation, exact cache invalidation, and viewport-bound dialog structure at short/portrait heights with long names and increased font scale. Native primitives are mocked in component tests; they do not prove physical layout or native Back/backdrop behavior. On Android and iOS, manually check portrait/landscape, larger accessibility text, both themes, Back/backdrop, account switching and the reset command. No new native dependency or rebuild is required by this feature.
