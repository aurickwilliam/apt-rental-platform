import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Tenant Browse authorizes first, then streams discovery and filtered results behind separate boundaries", () => {
  const page = source("app/tenant/browse/page.tsx");

  const guard = page.indexOf('await requirePortalViewer("tenant")');
  const shell = page.indexOf("<BrowseShell");
  assert.ok(guard > -1 && shell > guard, "the auth/role guard must run before the browser shell renders");

  // Discovery renders in its own async server component; the page never
  // awaits the sections read before returning the shell.
  const discovery = page.indexOf("<BrowseDiscoveryContent");
  assert.ok(discovery > shell);
  assert.ok(!/await fetchBrowseSections/.test(page));
  assert.match(page, /<BrowseSectionsSkeleton \/>/);
  assert.match(source("app/browse/components/BrowseDiscoveryContent.tsx"), /await fetchDiscoverySections\(supabase, basePath\)/);

  // Filtered/search/paged state streams the rail, mobile entry and grid from
  // the same request-scoped result query.
  assert.match(page, /<BrowseFilterRailSkeleton stickyClassName=\{FILTER_STICKY_CLASS\} \/>/);
  assert.match(page, /<FilterEntrySkeleton \/>/);
  assert.match(page, /fallback=\{<BrowseCardsSkeleton \/>\}/);
  assert.ok(page.indexOf("async function BrowseFilterRail") > shell);
  assert.ok(page.indexOf("async function BrowseGridContent") > shell);
  assert.equal((page.match(/loadBrowseResults\(supabase, params\)/g) ?? []).length, 3);
  assert.match(source("app/browse/lib/fetch-browse-results.ts"), /export const loadBrowseResults = cache\(fetchBrowseResults\);/);
});

test("Profile cards render account status first and stream verification activity separately", () => {
  const card = source("app/components/passport/PassportProfileCard.tsx");
  assert.doesNotMatch(card, /user_verifications/);
  assert.doesNotMatch(card, /VerificationActivityTimeline/);
  assert.match(card, /verificationSlot\?: ReactNode/);
  assert.match(card, /accountStatus === "rejected"/);
  assert.match(card, /\{!isVerified \? verificationSlot : null\}/);

  const activity = source("app/components/passport/ProfileVerificationActivity.tsx");
  assert.match(activity, /from\("user_verifications"\)/);
  assert.match(activity, /\.eq\("user_id", profileId\)/);
  assert.match(activity, /\.order\("submitted_at", \{ ascending: false \}\)/);
  assert.match(activity, /\.limit\(1\)/);

  for (const page of ["app/tenant/profile/page.tsx", "app/landlord/profile/page.tsx"]) {
    const contents = source(page);
    assert.doesNotMatch(contents, /\.from\("user_verifications"\)/, `${page} must not await verification data`);
    assert.match(contents, /verificationSlot=\{/);
    assert.match(contents, /profile\.account_status !== "verified" \?/);
    assert.match(contents, /<Suspense fallback=\{<VerificationActivitySkeleton \/>\}>/);
    assert.match(contents, /<ProfileVerificationActivity profileId=\{profile\.id\} \/>/);
  }
});

test("My Rental splits rental context from fresh financial reads and localizes financial loading", () => {
  const hook = source("hooks/use-tenancy.ts");
  assert.match(hook, /useAsyncResource\(\s*loadContext/);
  assert.match(hook, /fetchTenancyFinance\(tenancyId\)/);
  assert.match(hook, /const financeReady = !finance\.loading && !finance\.error;/);
  assert.match(hook, /const financeLoading = tenancyId !== null && finance\.loading;/);
  assert.match(hook, /\.eq\("tenancy_id", tenancyId\)/);
  assert.match(hook, /\.limit\(200\)/);

  const page = source("app/tenant/my-rental/MyRentalClient.tsx");
  assert.match(page, /financeLoading \? \(\s*<RentFinanceSkeleton \/>/);
  assert.match(page, /financeError \? \(\s*<RentFinanceError /);
  assert.match(page, /paymentError \? \(\s*<RentFinanceError/);
  assert.match(page, /<PaymentHistorySkeleton \/>/);
  assert.match(page, /void retryFinance\(\)/);
  // Pay Now remains inside the only branch that has authoritative finance.
  assert.ok(page.indexOf("Pay now") > page.indexOf("financeError ?"), "payment actions must wait for finance data");
  assert.ok(page.indexOf("Pay now") > page.indexOf("paymentError ? ("), "payment actions must wait for payment history");
  assert.ok(page.indexOf("Pay now") > page.indexOf("<RentFinanceSkeleton />"));
});

test("Payment checkout waits for the same authoritative financial reads", () => {
  const page = source("app/tenant/payment/page.tsx");
  assert.match(page, /if \(tenancyLoading \|\| financeLoading \|\| paymentsQuery\.loading\)/);
  assert.match(page, /if \(tenancyError \|\| financeError \|\| paymentsQuery\.error/);
  assert.match(page, /void retryFinance\(\)/);
  assert.match(page, /void revalidate\(\)/);
});

test("Messages authorizes first, then shares one two-pane skeleton between route and page loading", () => {
  const skeleton = source("app/components/chat/MessagesRouteSkeleton.tsx");
  assert.match(skeleton, /aria-busy="true"/);
  assert.match(skeleton, /aria-label="Loading messages"/);

  for (const [page, workspace, loading] of [
    ["app/tenant/messages/page.tsx", "TenantMessagesWorkspace", "app/tenant/messages/loading.tsx"],
    ["app/landlord/messages/page.tsx", "LandlordMessagesWorkspace", "app/landlord/messages/loading.tsx"],
  ]) {
    const contents = source(page);
    assert.ok(contents.indexOf('redirect("/login")') < contents.indexOf("<Suspense"));
    assert.match(contents, new RegExp(`<Suspense fallback=\\{<MessagesRouteSkeleton />\\}>`));
    assert.match(contents, new RegExp(`<${workspace}`));
    // One portal-scoped conversation read; suspense must not add a second.
    assert.equal((contents.match(/get_portal_conversations/g) ?? []).length, 1);
    assert.match(contents, /buildPortalContacts\(/);
    assert.ok(existsSync(new URL(`../${loading}`, import.meta.url)));
    assert.match(source(loading), /import MessagesRouteSkeleton from "@\/app\/components\/chat\/MessagesRouteSkeleton";/);
  }
});
