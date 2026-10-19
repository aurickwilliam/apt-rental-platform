// Reconstruct the real app table/constraint/trigger contract in a disposable
// local database. Does not contact Supabase or copy any real user/file data.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { validateConnection } from "../db-populate.mjs";
import { stableId } from "./planner.mjs";

validateConnection(process.env, { local: true }, []);
if (!/^apt_population_test_[a-z0-9_]+$/.test(process.env.PGDATABASE)) throw new Error("Use a fresh apt_population_test_* database on loopback.");
if (!process.argv[2]) throw new Error("Pass a reviewed schema-only JSON export from export-schema.sql.");
const schema = JSON.parse(readFileSync(process.argv[2], "utf8"));
const q = (s) => `"${s.replaceAll('"', '""')}"`;
const statements = [
  "begin;",
  "do $$begin if exists(select 1 from pg_tables where schemaname='public') then raise exception 'Test database is not empty'; end if; end$$;",
  "do $$begin if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if; if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if; if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role; end if; end$$;",
  "create schema auth; create schema storage; create schema private; create schema net; create schema test_support; create schema extensions;",
  // Location editing is outside this test contract (the command cannot change
  // locations). Supply its declaration type without installing PostGIS.
  "create domain extensions.geometry as text;",
  "create table auth.users(id uuid primary key); create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text);",
  "create table test_support.outbound(id bigint generated always as identity, body jsonb);",
  "create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid$$;",
  "create function storage.foldername(text) returns text[] language sql immutable as $$select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1]$$;",
  // External network boundary: record attempted delivery, never make requests.
  "create function net.http_post(url text, headers jsonb default '{}'::jsonb, body jsonb default '{}'::jsonb) returns bigint language plpgsql as $$begin insert into test_support.outbound(body) values(body); return 1; end$$;",
];
const tables = new Map();
for (const c of schema.columns) {
  if (!tables.has(c.table_name)) tables.set(c.table_name, []);
  if (c.udt_schema !== "pg_catalog") throw new Error("Review unsupported custom schema types before testing.");
  const type = c.udt_name === "_text" ? "text[]" : `pg_catalog.${q(c.udt_name)}`;
  tables.get(c.table_name).push(`${q(c.column_name)} ${type}${c.column_default ? ` default ${c.column_default}` : ""}${c.is_nullable === "NO" ? " not null" : ""}`);
}
for (const [name, columns] of tables) statements.push(`create table public.${q(name)} (${columns.join(",")});`);
for (const c of schema.constraints.filter((c) => !c.definition.startsWith("FOREIGN KEY"))) statements.push(`alter table public.${q(c.table_name)} add constraint ${q(c.conname)} ${c.definition};`);
for (const c of schema.constraints.filter((c) => c.definition.startsWith("FOREIGN KEY"))) statements.push(`alter table public.${q(c.table_name)} add constraint ${q(c.conname)} ${c.definition};`);
const constrained = new Set(schema.constraints.map((c) => c.conname));
for (const i of schema.indexes) if (!constrained.has(i.indexname)) statements.push(`${i.indexdef};`);

const ids = Array.from({ length: 8 }, (_, i) => stableId("fixture", `user:${i}`));
for (const [i, id] of ids.entries()) {
  const authId = stableId("fixture", `auth:${i}`);
  statements.push(`insert into auth.users(id) values('${authId}');`);
  statements.push(`insert into public.users(id,user_id,roles,account_status,is_suspended) values('${id}','${authId}',${i < 6 ? "'{tenant}'" : "'{landlord}'"},'verified',false);`);
  if (i < 6) {
    statements.push(`insert into public.passport_documents(id,user_id,doc_type,id_type,storage_path,is_verified,is_primary,review_status) values('${stableId("fixture", `id:${id}`)}','${id}','National ID','National ID','${id}/id.jpg',true,true,'verified'),('${stableId("fixture", `bill:${id}`)}','${id}','Proof of Residency',null,'${id}/bill.jpg',false,false,'unverified');`);
    statements.push(`insert into storage.objects(bucket_id,name) values('application-documents','${id}/id.jpg'),('application-documents','${id}/bill.jpg');`);
  }
}
statements.push(`update public.users set roles='{tenant,landlord,admin}' where id='${ids[0]}';`);
for (let i = 0; i < 20; i++) {
  statements.push(`insert into public.apartments(id,landlord_id,name,description,monthly_rent,type,street_address,barangay,city,province,no_bedrooms,no_bathrooms,area_sqm,status,rent_due_day) values('${stableId("fixture", `apt:${i}`)}','${[ids[0], ids[6], ids[7]][i % 3]}','Demo unit ${i}','Test fixture',12000,'Apartment','1 Test Street','Barangay 1','Caloocan','Metro Manila',1,1,30,'available',${[5,30,31][i % 3]});`);
}
// Nonempty baseline: current/future reservations, a previous stay, an open
// application, paid rent, maintenance and an archived conversation. These
// must survive apply/reset/cleanup byte-for-byte, not just by row count.
const apt = (i) => stableId("fixture", `apt:${i}`);
for (const [i, tenant, apartment, owner, start, end, status] of [
  [0, ids[1], apt(1), ids[6], "2026-09-01", "2027-08-31", "active"],
  [1, ids[2], apt(2), ids[7], "2026-11-08", "2027-11-07", "active"],
  [2, ids[4], apt(3), ids[0], "2024-03-01", "2024-08-31", "ended"],
]) {
  statements.push(`insert into public.tenancies(id,tenant_id,apartment_id,landlord_id,lease_start,lease_end,status,monthly_rent,rent_due_day) values('${stableId("fixture", `baseline-stay:${i}`)}','${tenant}','${apartment}','${owner}','${start}','${end}','${status}',12000,5);`);
  if (status === "active") statements.push(`update public.apartments set status='occupied' where id='${apartment}';`);
}
statements.push(`insert into public.rental_application(id,tenant_id,apartment_id,status,occupation,employment_type,employer_name,monthly_income,move_in_date,no_occupants,has_pets,has_smoker,need_parking,gov_id_url,proof_of_billing_url) values('${stableId("fixture", "baseline-application")}','${ids[5]}','${apt(4)}','pending','Student','Student','Not applicable',0,'2026-11-16',1,false,false,false,'${ids[5]}/id.jpg','${ids[5]}/bill.jpg');`);
statements.push(`insert into public.payment(id,tenant_id,landlord_id,apartment_id,tenancy_id,method,status,date,amount,period_start,period_end,due_date,reference_id) values('${stableId("fixture", "baseline-payment")}','${ids[4]}','${ids[0]}','${apt(3)}','${stableId("fixture", "baseline-stay:2")}','card','paid','2024-06-05',12000,'2024-06-01','2024-06-30','2024-06-05','existing-fixture-payment');`);
statements.push(`insert into public.maintenance_request(id,tenant_id,landlord_id,apartment_id,title,category,message,urgency,status,resolved_at) values('${stableId("fixture", "baseline-maintenance")}','${ids[4]}','${ids[0]}','${apt(3)}','Existing repair','general_wear_and_tear','Existing fixture activity','low','resolved','2024-06-10');`);
statements.push(`insert into public.favorites(id,tenant_id,apartment_id) values('${stableId("fixture", "baseline-favorite")}','${ids[5]}','${apt(4)}'); update public.apartments set no_favorites=1 where id='${apt(4)}';`);
statements.push(`insert into public.chat(id,sender_id,receiver_id,apartment_id,message,message_type) values('${stableId("fixture", "baseline-chat")}','${ids[5]}','${ids[6]}','${apt(4)}','Existing archived conversation','text'); insert into public.conversation_preferences(user_id,other_user_id,apartment_id,is_archived) values('${ids[5]}','${ids[6]}','${apt(4)}',true);`);
statements.push(`update public.apartments set no_favorites=null where id='${apt(8)}';`);
// Finance baselines exercise both kinds of collision and review preservation.
statements.push(`insert into public.landlord_expenses(id,landlord_id,apartment_id,category,treatment,amount,spent_on,description) values('${stableId("fixture", "baseline-expense")}','${ids[6]}','${apt(1)}','maintenance','operating',1234.56,'2026-09-08','Existing manual expense');`);
statements.push(`insert into public.landlord_budgets(landlord_id,apartment_id,month,category,kind,amount) values('${ids[7]}','${apt(2)}','2026-10-01','maintenance','expense',0);`);
statements.push(`insert into public.landlord_finance_reviews(landlord_id,apartment_id,month) values('${ids[0]}','${apt(3)}','2026-10-01');`);
// These are the actual exported production trigger bodies, not replacements.
for (const f of schema.functions) statements.push(`${f.definition};`);
for (const t of schema.triggers) statements.push(`${t.definition};`);
statements.push(readFileSync(new URL("../../supabase/migrations/20261017075357_safe_demo_population.sql", import.meta.url), "utf8"));
statements.push(readFileSync(new URL("../../supabase/migrations/20261019041228_demo_population_finance_extension.sql", import.meta.url), "utf8"));
statements.push("select demo_population.audit(); commit;");
const result = spawnSync("psql", ["-Xq", "--no-password", "--set", "ON_ERROR_STOP=1"], { input: statements.join("\n"), encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
if (result.status !== 0) { console.error(result.stderr); process.exitCode = 1; }
else console.log("Local schema contract, fixtures and population migration installed; trigger audit passed.");
