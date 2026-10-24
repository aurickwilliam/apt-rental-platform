import { createHash } from "node:crypto";
import { nextPaymentPeriod } from "../../packages/utils/src/rentPeriod.ts";
import { selectPassportDocsForApplication } from "../../packages/passport/src/selection.ts";
import { isVerifiedIdPath } from "../../packages/passport/src/idPath.ts";

export const VERSION = 1;
export const DEFAULT_SEED = "apt-demo-v1";
export const INSERT_TABLES = ["tenancies", "rental_application", "visit_request", "payment", "maintenance_request", "favorites", "reviews", "chat"];
const DAY = 86_400_000;
export const MAX_PLAN_ROWS = 5000;
const iso = (date) => date.toISOString().slice(0, 10);
export const addDays = (date, days) => iso(new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY));
const at = (date, hour = 10) => `${date}T${String(hour).padStart(2, "0")}:00:00+08:00`;
const hash = (text) => createHash("sha256").update(text).digest("hex");

export function stableId(seed, key) {
  const h = hash(`apt-population:${VERSION}:${seed}:${key}`);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const REFERENCE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export const REFERENCE_PATTERN = /^APT-[A-Z0-9]{8}$/;

// A payment reference in the same shape the apps generate for real checkouts
// (`APT-` plus eight capital letters or digits), derived from the payment's stable
// ID so a population is deterministic and a reset replays identical references.
export function aptReference(stableKey) {
  const digest = createHash("sha256").update(`apt-population-reference:${VERSION}:${stableKey}`).digest();
  let suffix = "";
  for (let i = 0; i < 8; i++) suffix += REFERENCE_ALPHABET[digest[i] % REFERENCE_ALPHABET.length];
  return `APT-${suffix}`;
}

// Re-keys the `DEMO-<stable id>` references of an already recorded plan. Nothing
// else in the plan changes, and the result equals what the generator now emits for
// the same seed, so a re-keyed run is indistinguishable from a freshly generated one.
export function rekeyPlanReferences(plan) {
  const next = structuredClone(plan);
  const seen = new Set();
  let changed = 0;
  for (const row of next.rows) {
    if (row.table !== "payment") continue;
    const current = row.data.reference_id;
    if (REFERENCE_PATTERN.test(current)) {
      if (seen.has(current)) throw new Error("Duplicate payment reference in the saved plan.");
      seen.add(current);
      continue;
    }
    if (typeof current !== "string" || !current.startsWith("DEMO-")) throw new Error("Unexpected payment reference in the saved plan.");
    const replacement = aptReference(current.slice("DEMO-".length));
    if (seen.has(replacement)) throw new Error("Re-keyed payment references would collide.");
    seen.add(replacement);
    row.data.reference_id = replacement;
    changed++;
  }
  return { plan: next, changed };
}

export function manilaToday(now = new Date()) {
  return iso(new Date(now.getTime() + 8 * 3_600_000));
}

export function validateOptions({ years, seed, asOf }) {
  if (!Number.isInteger(years) || years < 1 || years > 3) throw new Error("Years must be an integer from 1 to 3.");
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(seed)) throw new Error("Seed must contain 1–64 letters, numbers, hyphens or underscores.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || Number.isNaN(Date.parse(`${asOf}T00:00:00Z`)) || iso(new Date(`${asOf}T00:00:00Z`)) !== asOf || asOf > manilaToday()) {
    throw new Error("As-of must be a valid date, not later than today in Manila.");
  }
}

export function billingPeriods(start, end, dueDay) {
  const [year, month] = start.split("-").map(Number);
  const previous = iso(new Date(Date.UTC(year, month - 2, 1)));
  const result = [];
  for (let p = nextPaymentPeriod(previous, dueDay); p.dueDate <= end; p = nextPaymentPeriod(p.periodStart, dueDay)) {
    if (p.dueDate >= start) result.push(p);
  }
  return result;
}

const overlaps = (a, b) => a.lease_start <= (b.lease_end ?? "9999-12-31") && b.lease_start <= (a.lease_end ?? "9999-12-31");
const samePair = (row, a, b) => (row.sender_id === a && row.receiver_id === b) || (row.sender_id === b && row.receiver_id === a);

export function buildPlan(inventory, options) {
  validateOptions(options);
  const { seed, years, asOf } = options;
  const source = inventory.tables;
  const rows = [];
  const skipped = {};
  const skip = (reason) => { skipped[reason] = (skipped[reason] ?? 0) + 1; };
  const users = new Map(source.users.map((u) => [u.id, u]));
  const tenants = source.users.filter((u) => u.roles?.includes("tenant") && !u.is_suspended).sort((a, b) => a.id.localeCompare(b.id));
  const verified = tenants.filter((u) => u.account_status === "verified");
  const conflictedTenants = new Set();
  const conflictedApartments = new Set();
  for (const [i, tenancy] of source.tenancies.entries()) {
    for (const other of source.tenancies.slice(i + 1)) {
      if ((tenancy.tenant_id === other.tenant_id || tenancy.apartment_id === other.apartment_id) && overlaps(tenancy, other)) {
        conflictedTenants.add(tenancy.tenant_id); conflictedTenants.add(other.tenant_id);
        conflictedApartments.add(tenancy.apartment_id); conflictedApartments.add(other.apartment_id);
      }
    }
  }
  if (conflictedTenants.size) skipped.existing_rental_conflicts = conflictedTenants.size;
  const apartments = source.apartments.filter((a) => {
    const owner = users.get(a.landlord_id);
    const hasActive = source.tenancies.some((t) => t.apartment_id === a.id && t.status === "active");
    if ((a.status === "occupied" && !hasActive) || (a.status === "available" && hasActive)) { skip("existing_occupancy_mismatch"); return false; }
    if (conflictedApartments.has(a.id)) return false;
    return !a.deleted_at && !a.is_hidden_by_admin && ["available", "occupied"].includes(a.status) && owner?.roles?.includes("landlord") && !owner.is_suspended && Number(a.monthly_rent) > 0;
  });
  const allTenancies = [...source.tenancies];
  const usedOwners = new Map();
  const usedApartments = new Map();
  const files = new Set(inventory.storage.map((o) => `${o.bucket_id}/${o.name}`));
  const add = (table, key, data, date) => {
    const row = { table, data: { id: stableId(seed, key), ...data }, eventTime: at(date) };
    rows.push(row);
    return row.data;
  };
  const ownedFile = (userId, path, identity = false) => {
    if (!path?.startsWith(`${userId}/`)) return false;
    return files.has(`${identity && isVerifiedIdPath(path) ? "user-verification" : "application-documents"}/${path}`);
  };
  const docsFor = (tenant) => {
    // Reuse the exact shared slot selection. Historical reuse is an approved
    // simulation exception, not a claim that these files existed three years ago.
    const docs = (source.passport_documents ?? []).filter((d) => d.user_id === tenant.id && ownedFile(tenant.id, d.storage_path, !!(d.id_type || d.verification_id)) && (!d.storage_path_back || ownedFile(tenant.id, d.storage_path_back, true)));
    const selection = selectPassportDocsForApplication(docs, "Student");
    return selection.missing.length || selection.expired.length ? null : selection.docs;
  };
  const choose = (tenant, start, end, current = false) => conflictedTenants.has(tenant.id) ? undefined : apartments.filter((a) => a.landlord_id !== tenant.id && (!current || (a.status === "available" && !allTenancies.some((t) => t.status === "active" && (t.tenant_id === tenant.id || t.apartment_id === a.id)))) && !allTenancies.some((t) => (t.tenant_id === tenant.id || t.apartment_id === a.id) && overlaps(t, { lease_start: start, lease_end: end })))
    .sort((a, b) => (usedOwners.get(a.landlord_id) ?? 0) - (usedOwners.get(b.landlord_id) ?? 0) || (usedApartments.get(a.id) ?? 0) - (usedApartments.get(b.id) ?? 0) || hash(`${seed}:${tenant.id}:${start}:${a.id}`).localeCompare(hash(`${seed}:${tenant.id}:${start}:${b.id}`)))[0];

  const addApplication = (tenant, apartment, key, date, moveIn, status) => {
    const docs = docsFor(tenant);
    if (!docs) { skip("applications_without_usable_passport"); return null; }
    if (status === "pending" && source.rental_application.some((r) => r.tenant_id === tenant.id && r.apartment_id === apartment.id && r.status === "pending")) return null;
    return add("rental_application", `${key}:application`, {
      tenant_id: tenant.id, apartment_id: apartment.id, status,
      occupation: "Student", employment_type: "Student", employer_name: "Not applicable", monthly_income: 0,
      move_in_date: moveIn, no_occupants: 1, has_pets: false, has_smoker: false, need_parking: false,
      message: "Demo scenario: looking for a quiet place near school and transport.",
      gov_id_url: docs.govId.storage_path, gov_id_back_url: docs.govId.storage_path_back ?? null,
      proof_of_billing_url: docs.proofOfBilling.storage_path,
      proof_of_income_url: docs.proofOfIncome?.storage_path ?? null, nbi_clearance_url: docs.nbiClearance?.storage_path ?? null,
      rejected_reason: status === "rejected" ? "Demo scenario: move-in schedule did not match availability." : null,
      created_at: at(date), updated_at: at(status === "approved" ? addDays(moveIn, -5) : addDays(date, 1)),
    }, date);
  };

  const addVisit = (tenant, a, key, date, status, application) => {
    // Reserve an hour for both people, including existing confirmed reschedules.
    const taken = [...source.visit_request, ...rows.filter((r) => r.table === "visit_request").map((r) => r.data)];
    const hour = [9, 10, 11, 13, 14, 15, 16].find((h) => !taken.some((v) => ["pending", "approved", "rescheduled"].includes(v.status) && (v.confirmed_visit_date ?? v.visit_date) === date && (v.confirmed_time ?? v.time).startsWith(String(h).padStart(2, "0")) && (v.tenant_id === tenant.id || v.landlord_id === tenant.id || v.tenant_id === a.landlord_id || v.landlord_id === a.landlord_id)));
    if (!hour) { skip("visit_schedule_conflict"); return; }
    const created = [addDays(date, -3), addDays(asOf, -1)].sort()[0];
    add("visit_request", `${key}:visit`, {
      tenant_id: tenant.id, landlord_id: a.landlord_id, apartment_id: a.id, application_id: application?.id ?? null,
      visit_date: status === "rescheduled" ? addDays(date, -1) : date, time: `${String(hour).padStart(2, "0")}:00:00`, no_visitors: 1, status,
      notes: "Demo scenario: viewing the unit and discussing house rules.",
      responded_at: status === "pending" ? null : at([addDays(date, -2), asOf].sort()[0]),
      confirmed_visit_date: status === "rescheduled" ? date : null,
      confirmed_time: status === "rescheduled" ? `${String(hour).padStart(2, "0")}:00:00` : null,
      rejected_reason: status === "rejected" ? "Demo scenario: viewing time unavailable." : null,
      created_at: at(created), updated_at: at(status === "pending" ? created : [addDays(date, -2), asOf].sort()[0]),
    }, created);
  };

  const addChat = (tenant, a, key, date, current = false) => {
    // Never append to existing threads: their archive/unread state is user work.
    if (source.chat.some((c) => c.apartment_id === a.id && samePair(c, tenant.id, a.landlord_id)) || source.conversation_preferences.some((p) => p.apartment_id === a.id && [tenant.id, a.landlord_id].includes(p.user_id) && [tenant.id, a.landlord_id].includes(p.other_user_id))) { skip("existing_conversation_preserved"); return; }
    if (source.user_blocks.some((b) => [tenant.id, a.landlord_id].includes(b.blocker_id) && [tenant.id, a.landlord_id].includes(b.blocked_id))) { skip("blocked_conversation"); return; }
    const texts = current
      ? ["Hi! Is the unit still available for viewing?", "Yes, we can arrange a visit. Which day works for you?", "Would Saturday morning be possible?", "That works. Please message before you arrive."]
      : ["Hi! I would like to ask about the unit and house rules.", "Hello! The rent covers the unit; utilities are billed separately.", "Thank you. The location works well for my commute.", "You are welcome. Let me know if you have any other questions.", "Thanks for helping with the move-in arrangements.", "Happy to help. Please report any maintenance concerns here."];
    texts.forEach((message, i) => {
      const timestamp = at(addDays(date, Math.floor(i / 2)), 9 + i % 2);
      const read = !current || i < texts.length - 1;
      add("chat", `${key}:chat:${i}`, {
        apartment_id: a.id, sender_id: i % 2 ? a.landlord_id : tenant.id, receiver_id: i % 2 ? tenant.id : a.landlord_id,
        message, message_type: "text", is_read: read, read_at: read ? timestamp : null,
        created_at: timestamp, updated_at: timestamp,
      }, addDays(date, Math.floor(i / 2)));
    });
  };

  const addStay = (tenant, a, key, start, end, active) => {
    const created = addDays(start, -5);
    const tenancy = add("tenancies", `${key}:tenancy`, {
      tenant_id: tenant.id, apartment_id: a.id, landlord_id: a.landlord_id, lease_start: start, lease_end: end,
      status: active ? "active" : "ended", monthly_rent: a.monthly_rent, security_deposit: a.security_deposit ?? 0,
      advance_rent: a.advance_rent ?? 0, rent_due_day: a.rent_due_day ?? 5,
      notes: "Simulated demo history; not a real executed lease.", created_at: at(created), updated_at: at(active ? created : end),
    }, created);
    allTenancies.push(tenancy);
    usedOwners.set(a.landlord_id, (usedOwners.get(a.landlord_id) ?? 0) + 1);
    usedApartments.set(a.id, (usedApartments.get(a.id) ?? 0) + 1);
    const application = addApplication(tenant, a, key, addDays(start, -14), start, "approved");
    addVisit(tenant, a, key, addDays(start, -9), "approved", application);
    const periods = billingPeriods(start, active ? asOf : end, tenancy.rent_due_day);
    // Also show a current-month cash confirmation when the due day is still
    // ahead. Historical months remain settled; no fake years-old arrears.
    if (active) {
      const [year, month] = asOf.split("-").map(Number);
      const current = nextPaymentPeriod(iso(new Date(Date.UTC(year, month - 2, 1))), tenancy.rent_due_day);
      if (current.dueDate > asOf && current.dueDate >= start) periods.push(current);
    }
    periods.forEach((p, i) => {
      const pending = p.dueDate > asOf;
      const paidOn = pending ? asOf : p.dueDate;
      const method = pending ? "cash" : ["cash", "gcash", "maya", "card", "qrph"][i % 5];
      add("payment", `${key}:payment:${p.periodStart}`, {
        tenant_id: tenant.id, apartment_id: a.id, landlord_id: a.landlord_id, tenancy_id: tenancy.id,
        method, status: pending ? "pending" : "paid", date: paidOn, amount: a.monthly_rent,
        period_start: p.periodStart, period_end: p.periodEnd, due_date: p.dueDate,
        reference_id: aptReference(stableId(seed, `${key}:${p.periodStart}`)),
        created_at: at(paidOn), updated_at: at(paidOn),
      }, paidOn);
    });
    const maintenanceDate = active ? addDays(asOf, -2) : addDays(start, 35);
    if (maintenanceDate <= (end ?? asOf)) {
      const variation = hash(key).charCodeAt(0) % 4;
      const status = active ? ["pending", "in_progress", "resolved", "resolved"][variation] : ["resolved", "resolved", "resolved", "cancelled"][variation];
      const resolved = status === "resolved";
      const issues = [
        { title: "Leaking kitchen faucet", category: "plumbing_water_fixtures", message: "The kitchen faucet drips after it is turned off.", resolution: "Replaced the worn washer and checked for leaks." },
        { title: "Loose bedroom light switch", category: "electrical_lighting", message: "The bedroom switch needs checking by an electrician.", resolution: "An electrician secured and tested the switch." },
        { title: "Window latch needs adjustment", category: "general_wear_and_tear", message: "The window latch is difficult to close.", resolution: "Adjusted the latch and checked the window seal." },
        { title: "Routine pest-control request", category: "pest_control", message: "Please arrange a routine pest-control inspection.", resolution: "Completed a scheduled inspection and treatment." },
      ];
      const issue = issues[variation];
      add("maintenance_request", `${key}:maintenance`, {
        tenant_id: tenant.id, landlord_id: a.landlord_id, apartment_id: a.id,
        title: issue.title, category: issue.category, urgency: variation === 1 ? "medium" : "low",
        message: `Demo scenario: ${issue.message}`, status,
        resolved_at: resolved ? at(addDays(maintenanceDate, 1)) : null,
        cancelled_at: status === "cancelled" ? at(addDays(maintenanceDate, 1)) : null,
        resolution_notes: resolved ? `Demo scenario: ${issue.resolution}` : null,
        image_urls: [], created_at: at(maintenanceDate), updated_at: at(addDays(maintenanceDate, 1)),
      }, maintenanceDate);
    }
    if (!active && ![...source.reviews, ...rows.filter((r) => r.table === "reviews").map((r) => r.data)].some((r) => r.tenant_id === tenant.id && r.apartment_id === a.id)) {
      add("reviews", `${key}:review`, {
        tenant_id: tenant.id, apartment_id: a.id, tenancy_id: tenancy.id, rating: [3.5, 4, 4.5, 5][hash(key).charCodeAt(0) % 4],
        comment: "Demo review: convenient commute and responsive communication about repairs.", stayed_date: start, image_paths: [], created_at: at(addDays(end, 1)),
      }, addDays(end, 1));
    }
    addChat(tenant, a, key, addDays(start, -7));
  };

  // Six-month stays with gaps, anchored inside a 36-month window. Existing
  // tenancy dates are reservations, regardless of status; none are rewritten.
  const windowStart = addDays(asOf, -Math.floor(years * 365.25));
  for (const [ti, tenant] of verified.entries()) {
    for (let day = 28 + ti * 5; day + 181 < years * 365.25; day += 225) {
      const start = addDays(windowStart, day);
      const end = addDays(start, 179);
      if (end >= addDays(asOf, -45)) continue;
      const a = choose(tenant, start, end);
      if (a) addStay(tenant, a, `history:${tenant.id}:${start}`, start, end, false);
      else skip("historical_rental_conflict");
    }
  }
  const existingActive = source.tenancies.filter((t) => t.status === "active").length;
  let remainingActive = Math.max(0, Math.min(4, Math.max(0, verified.length - 2)) - existingActive);
  for (const tenant of verified) {
    if (!remainingActive) break;
    const start = addDays(asOf, -110);
    const end = addDays(asOf, 255);
    const a = choose(tenant, start, end, true);
    if (!a) continue;
    addStay(tenant, a, `current:${tenant.id}`, start, end, true);
    remainingActive--;
  }

  for (const [ti, tenant] of tenants.entries()) {
    const browsing = !allTenancies.some((t) => t.tenant_id === tenant.id && t.status === "active");
    const available = apartments.filter((a) => a.landlord_id !== tenant.id && a.status === "available" && !allTenancies.some((t) => t.apartment_id === a.id && t.status === "active"))
      .sort((a, b) => hash(`${seed}:browse:${tenant.id}:${a.id}`).localeCompare(hash(`${seed}:browse:${tenant.id}:${b.id}`)));
    for (const [i, a] of available.slice(0, browsing ? 4 : 2).entries()) {
      const key = `browse:${tenant.id}:${a.id}`;
      const date = addDays(asOf, -8 - i);
      if (!source.favorites.some((f) => f.tenant_id === tenant.id && f.apartment_id === a.id)) add("favorites", `${key}:favorite`, { tenant_id: tenant.id, apartment_id: a.id, created_at: at(date) }, date);
      if (!browsing) continue;
      addChat(tenant, a, key, addDays(asOf, -3), true);
      if (tenant.account_status === "verified" && i < 3) {
        const status = ["pending", "rejected", "cancelled"][i];
        const application = addApplication(tenant, a, key, date, addDays(asOf, 30), status);
        // The UI requires an application to arrange a visit; do not fabricate one.
        if (application) addVisit(tenant, a, key, i === 0 ? addDays(asOf, 3 + ti) : addDays(asOf, -4 - i), i === 0 ? ["pending", "approved", "rescheduled"][ti % 3] : status, application);
      }
    }
  }
  rows.sort((a, b) => INSERT_TABLES.indexOf(a.table) - INSERT_TABLES.indexOf(b.table) || a.data.id.localeCompare(b.data.id));
  if (rows.length > MAX_PLAN_ROWS) throw new Error("Generated dataset exceeds the 5,000-row safety limit.");
  const counts = Object.fromEntries(INSERT_TABLES.map((table) => [table, rows.filter((r) => r.table === table).length]));
  const plan = { version: VERSION, seed, years, asOf, rows, summary: { counts, skipped, simulatedHistory: true, currentRentersAdded: rows.filter((r) => r.table === "tenancies" && r.data.status === "active").length } };
  validatePlan(plan, inventory);
  return plan;
}

export function validatePlan(plan, inventory) {
  const ids = new Set();
  const references = new Set();
  const users = new Map(inventory.tables.users.map((u) => [u.id, u]));
  const apartments = new Map(inventory.tables.apartments.map((a) => [a.id, a]));
  const tenancies = [...inventory.tables.tenancies, ...plan.rows.filter((r) => r.table === "tenancies").map((r) => r.data)];
  for (const { table, data } of plan.rows) {
    if (!INSERT_TABLES.includes(table) || ids.has(data.id)) throw new Error("Unexpected table or duplicate generated ID.");
    ids.add(data.id);
    const a = apartments.get(data.apartment_id);
    const tenantId = table === "chat" ? (data.sender_id === a?.landlord_id ? data.receiver_id : data.sender_id) : data.tenant_id;
    const tenant = users.get(tenantId);
    if (!a || a.deleted_at || a.is_hidden_by_admin || !tenant?.roles?.includes("tenant") || tenant.is_suspended || tenantId === a.landlord_id || !users.get(a.landlord_id)?.roles?.includes("landlord") || users.get(a.landlord_id).is_suspended) throw new Error("Invalid tenant/apartment/owner relationship.");
    if (data.landlord_id && data.landlord_id !== a.landlord_id) throw new Error("Owner mismatch.");
    if (table === "tenancies" && (data.lease_start > (data.lease_end ?? "9999-12-31") || tenancies.some((t) => t.id !== data.id && (t.tenant_id === tenantId || t.apartment_id === a.id) && (overlaps(t, data) || (t.status === "active" && data.status === "active"))))) throw new Error("Rental dates overlap existing or generated activity.");
    if (table === "payment") {
      if (references.has(data.reference_id)) throw new Error("Duplicate payment reference.");
      references.add(data.reference_id);
      const t = tenancies.find((t) => t.id === data.tenancy_id);
      if (!t || t.tenant_id !== tenantId || t.apartment_id !== a.id || Number(data.amount) !== Number(t.monthly_rent) || data.due_date < t.lease_start || data.due_date > t.lease_end || (data.status === "paid" && data.date > plan.asOf) || !REFERENCE_PATTERN.test(data.reference_id ?? "")) throw new Error("Invalid demo payment.");
    }
    if (data.created_at && data.created_at.slice(0, 10) > plan.asOf) throw new Error("Generated activity cannot be created in the future.");
  }
  return true;
}

export function previewToken(stateHash, mode, plan) {
  return hash(JSON.stringify({ stateHash, mode, plan }));
}
