import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const readMigration = (name) => readFile(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8');
const migration = await readMigration('20261106090000_lease_renewals.sql');
const billing = await readMigration('20261020101501_move_in_billing.sql');
const cash = await readMigration('20261016141949_guard_cash_payment_submissions.sql');
const reminders = await readMigration('20260826054353_rent_due_reminders.sql');
const reminderFunction = reminders.slice(reminders.indexOf('create or replace function public.notify_rent_due_status()'),reminders.indexOf('revoke execute on function public.notify_rent_due_status()'));
const paymentNotice=await readMigration('20260830000000_payment_notification_tenant_name.sql');

// Dedicated test-only database. No env loading, credentials, hosted data or provider calls.
const schema = `
create role anon; create role authenticated; create role service_role;
create schema auth; create schema storage; create schema app_private; create schema demo_population;
create table demo_population.runs(id uuid primary key);
create table demo_population.audited_functions(name text primary key,hash text not null);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('role',coalesce(nullif(current_setting('test.role',true),''),'authenticated')) $$;
create table users(id uuid primary key,user_id uuid unique,first_name text,last_name text,
  is_suspended boolean not null default false,roles text[] not null,account_status text not null default 'verified');
create table apartments(id uuid primary key,landlord_id uuid,name text,monthly_rent numeric,security_deposit numeric,advance_rent numeric,deleted_at timestamptz);
create table tenancies(id uuid primary key default gen_random_uuid(),apartment_id uuid,tenant_id uuid,landlord_id uuid,
  lease_start date not null,lease_end date,monthly_rent numeric,security_deposit numeric,advance_rent numeric,
  signed_lease_path text,rent_due_day smallint default 5,status text default 'active',created_at timestamptz default now());
create table payment(id uuid primary key default gen_random_uuid(),created_at timestamptz default now(),updated_at timestamptz,
  date date default current_date,amount numeric,status text default 'pending',method text,tenant_id uuid,apartment_id uuid,
  tenancy_id uuid,landlord_id uuid,period_start date,period_end date,due_date date,reference_id text,paymongo_session_id text,
  constraint payment_status_check check(status in ('pending','paid','partial','unpaid')));
create table maintenance_request(id uuid primary key default gen_random_uuid(),apartment_id uuid,tenant_id uuid,
  tenancy_id uuid,title text,fee_amount numeric,fee_status text,created_at timestamptz default now());
create table email_outbox(id uuid primary key default gen_random_uuid(),user_id uuid,template text,params jsonb,
  constraint email_outbox_template_check check(template in ('warning')));
create table notifications(id uuid primary key default gen_random_uuid(),user_id uuid,type text,title text,message text,data jsonb);
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));
alter table storage.objects enable row level security;
create function app_private.is_active_user() returns boolean language sql stable security definer as $$
  select exists(select 1 from public.users where user_id=auth.uid() and not is_suspended) $$;
create function app_private.landlord_accepts_payment_method(uuid,text) returns boolean language sql as $$ select true $$;
create function app_private.queue_email(uuid,text,jsonb) returns void language sql as $$
  insert into public.email_outbox(user_id,template,params) values($1,$2,$3) $$;
create function public.create_notification(uuid,text,text,text,jsonb) returns void language sql as $$
  insert into public.notifications(user_id,type,title,message,data) values($1,$2,$3,$4,$5) $$;
create function public.get_landlord_dashboard(uuid) returns jsonb language sql as $$
  select to_jsonb(sum(p.amount)) from public.payment p where p.status='paid' $$;
create function public.notify_payment_created() returns trigger language plpgsql as $$ begin return new; end $$;
create table rent_reminders(id uuid default gen_random_uuid(),tenancy_id uuid,due_date date,kind text,unique(tenancy_id,due_date,kind));
`;

test('lease renewal SQL contract', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(schema);
  await db.exec(cash);
  await db.exec(paymentNotice);
  await db.exec(reminderFunction);
  await db.exec(billing);
  await db.exec(migration);
  await db.exec(`grant usage on schema public,auth,app_private,storage to authenticated;
    grant select,insert,update,delete on storage.objects to authenticated;`);
  const tenant = randomUUID(), landlord = randomUUID(), outsider = randomUUID();
  await db.query(`insert into users(id,user_id,first_name,roles) values
    ($1,$1,'Tenant',array['tenant']),($2,$2,'Landlord',array['landlord']),($3,$3,'Other',array['tenant'])`, [tenant,landlord,outsider]);
  const { rows: [calendar] } = await db.query(`select
    (now() at time zone 'Asia/Manila')::date::text as today,
    ((now() at time zone 'Asia/Manila')::date+10)::text as ending,
    ((now() at time zone 'Asia/Manila')::date+11)::text as starting`);
  const as = (id, role = 'authenticated') => db.query(`select set_config('test.uid',$1,false),set_config('test.role',$2,false)`,[id,role]);
  async function rental({ deposit = 30000 } = {}) {
    const apartment = randomUUID(), tenancy = randomUUID();
    await db.query(`insert into apartments(id,landlord_id,name,monthly_rent,security_deposit,advance_rent)
      values($1,$2,'Test Unit',15000,$3,0)`,[apartment,landlord,deposit]);
    await db.query(`insert into tenancies(id,apartment_id,tenant_id,landlord_id,lease_start,lease_end)
      values($1,$2,$3,$4,($5::date-interval '1 year')::date,$5)`,[tenancy,apartment,tenant,landlord,calendar.ending]);
    const b=(await db.query('select app_private.tenancy_bill($1,current_date) as b',[tenancy])).rows[0].b;
    const receipt=(await db.query(`insert into payment(tenancy_id,apartment_id,tenant_id,method,amount,period_start)
      values($1,$2,$3,'cash',$4,$5) returning id`,[tenancy,apartment,tenant,b.totalDue,b.periodStart])).rows[0];
    await db.query("update payment set status='paid' where id=$1",[receipt.id]);
    return { tenancy, apartment };
  }
  const context = async (r, portal = 'tenant') => (await db.query('select public.get_lease_renewal($1,$2) as c',[r.tenancy,portal])).rows[0].c;
  const act = (r, portal, action, version, payload = {}) => db.query('select public.act_on_lease_renewal($1,$2,$3,$4,$5)',[r.tenancy,portal,action,version,payload]);
  async function request(r) {
    await as(tenant);
    await act(r,'tenant','request',null,{durationMonths:12});
    return context(r);
  }
  async function propose(r, { retained = 30000, kind = 'none', advance = 1, rent = 15000 } = {}) {
    await as(landlord);
    let c = await context(r,'landlord');
    if(c.renewal.status==='pending_landlord_review') {
      await act(r,'landlord','approve',c.renewal.version);
      c = await context(r,'landlord');
    }
    await act(r,'landlord','propose',c.renewal.version,{
      proposalId:randomUUID(),durationMonths:12,monthlyRent:rent,retainedDeposit:retained,
      replenishmentKind:kind,reason:kind==='none'?'':'Documented agreed deductions',advanceMonths:advance,leaseStart:calendar.starting,
    });
    return context(r,'landlord');
  }
  async function agree(r) {
    await as(tenant);
    let c = await context(r);
    const proposalId = c.renewal.current_proposal_id;
    await act(r,'tenant','accept',c.renewal.version,{proposalId});
    c = await context(r);
    const path = `${c.renewal.id}/${proposalId}/${randomUUID()}.pdf`;
    await db.query(`insert into storage.objects(bucket_id,name) values('lease-renewals',$1)`,[path]);
    await as(landlord);
    await act(r,'landlord','agreement',c.renewal.version,{path});
    c=await context(r,'landlord');
    await act(r,'landlord','confirm_agreement',c.renewal.version,{proposalId,path});
    await as(tenant);
    c=await context(r);
    await act(r,'tenant','confirm_agreement',c.renewal.version,{proposalId,path});
    return context(r);
  }

  await t.test('duplicate requests, outsiders and wrong portals are refused', async () => {
    const r=await rental(); await request(r);
    await assert.rejects(act(r,'tenant','request',null,{durationMonths:12}),/already exists/);
    await as(outsider); await assert.rejects(context(r),/cannot view/);
    await as(landlord); await assert.rejects(context(r),/cannot view/);
    await as(tenant); await assert.rejects(act(r,'tenant','approve',1),/cannot be approved/);
  });
  await t.test('non-renewal and decline never end occupancy', async () => {
    const r=await rental(); await as(tenant); await act(r,'tenant','not_renewing',null,{durationMonths:12});
    assert.equal((await context(r)).renewal.status,'not_renewing');
    assert.equal((await db.query('select status from tenancies where id=$1',[r.tenancy])).rows[0].status,'active');
    const other=await rental(); await request(other); await as(landlord);
    await assert.rejects(act(other,'landlord','decline',1),/Provide a reason/);
    await act(other,'landlord','decline',1,{reason:'Property needed after this lease'});
    assert.equal((await context(other,'landlord')).renewal.status,'declined');
  });
  await t.test('approval does not activate terms, revisions require fresh acceptance', async () => {
    const r=await rental(); await request(r); const c=await propose(r);
    assert.equal(c.renewal.status,'awaiting_tenant_confirmation');
    assert.equal(c.proposals[0].deposit_due,0);
    await propose(r,{retained:20000,kind:'partial'});
    await as(tenant);
    await assert.rejects(act(r,'tenant','accept',c.renewal.version,{proposalId:c.renewal.current_proposal_id}),/changed/);
    assert.equal((await context(r)).proposals.length,2);
  });
  await t.test('partial and full replenishment match only the missing deposit', async () => {
    for(const [retained,kind,amount] of [[20000,'partial',10000],[0,'full',30000]]) {
      const r=await rental(); await request(r); const c=await propose(r,{retained,kind});
      assert.equal(c.proposals[0].deposit_due,amount);
    }
    const r=await rental(); await request(r);
    await assert.rejects(propose(r,{retained:30000,kind:'full'}),/check constraint/);
  });
  await t.test('zero-payment renewal still needs both agreement confirmations', async () => {
    const r=await rental(); await request(r); await propose(r,{advance:0});
    const c=await agree(r);
    assert.equal(c.renewal.status,'renewed');
    assert.equal(c.payment,null);
    assert.equal(c.leaseEnd,calendar.ending);
    const rows=(await db.query('select *,lease_start::text as start_text from tenancy_lease_terms where tenancy_id=$1 order by lease_start',[r.tenancy])).rows;
    assert.equal(rows.length,2);
    assert.equal(rows[1].start_text,calendar.starting);
  });
  await t.test('payment cannot skip confirmation; paid callback finalizes exactly once', async () => {
    const r=await rental(); await request(r); let c=await propose(r,{retained:20000,kind:'partial'});
    const p=c.proposals[0];
    const pay = (amount=25000) => db.query(`insert into payment(tenancy_id,apartment_id,tenant_id,renewal_proposal_id,
      method,amount,period_start,status) values($1,$2,$3,$4,'cash',$5,$6,'pending') returning *`,
      [r.tenancy,r.apartment,tenant,p.id,amount,p.advance_period]);
    await as(tenant); await assert.rejects(pay(),/not ready/);
    c=await agree(r); assert.equal(c.renewal.status,'awaiting_payment');
    await assert.rejects(pay(1),/Refresh the renewal bill/);
    const payment=(await pay()).rows[0];
    assert.equal(Number(payment.deposit_amount),10000);
    assert.equal(Number(payment.advance_amount),15000);
    assert.equal(Number(payment.rental_income_amount),15000);
    assert.equal((await context(r)).renewal.status,'payment_verification_pending');
    await assert.rejects(pay(),/not ready/);
    await as(landlord);
    await db.query("update payment set status='paid' where id=$1",[payment.id]);
    await db.query("update payment set status='paid' where id=$1",[payment.id]);
    assert.equal((await context(r,'landlord')).renewal.status,'renewed');
    assert.equal((await db.query('select count(*)::int as n from tenancy_lease_terms where tenancy_id=$1',[r.tenancy])).rows[0].n,2);
    await assert.rejects(db.query('update payment set renewal_proposal_id=null where id=$1',[payment.id]),/linkage/);
  });
  await t.test('ordinary billing guard still rejects underpriced rent', async () => {
    const r=await rental(); await as(tenant);
    await assert.rejects(db.query(`insert into payment(tenancy_id,tenant_id,apartment_id,method,amount,period_start)
      values($1,$2,$3,'cash',1,date_trunc('month',current_date)::date)`,[r.tenancy,tenant,r.apartment]),/bill has changed/);
  });

  await t.test('RLS isolates records and private helpers cannot be called by clients', async () => {
    const r=await rental(); await request(r); const c=await propose(r);
    await as(outsider);
    await db.exec('set role authenticated');
    try {
      assert.equal((await db.query('select count(*)::int as n from lease_renewal_proposals where id=$1',[c.proposals[0].id])).rows[0].n,0);
      assert.equal((await db.query('select count(*)::int as n from lease_renewal_events where renewal_id=$1',[c.renewal.id])).rows[0].n,0);
      await assert.rejects(db.query('select app_private.finish_lease_renewal($1)',[c.renewal.id]),/permission denied/);
      await assert.rejects(db.query("update lease_renewals set status='renewed' where id=$1",[c.renewal.id]),/permission denied/);
    } finally {await db.exec('reset role');}
    await as(tenant);await db.exec('set role authenticated');
    try {
      assert.equal((await db.query('select count(*)::int as n from lease_renewal_proposals where id=$1',[c.proposals[0].id])).rows[0].n,1);
      await assert.rejects(db.query('update lease_renewal_proposals set monthly_rent=1 where id=$1',[c.proposals[0].id]),/permission denied/);
    } finally {await db.exec('reset role');}
  });

  await t.test('private files are landlord-uploaded and tenant reads require a recorded reference', async () => {
    const r=await rental();await request(r);const c=await propose(r);
    const path=`${c.renewal.id}/${c.proposals[0].id}/${randomUUID()}.pdf`;
    await as(tenant);await db.exec('set role authenticated');
    try {await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values('lease-renewals',$1)",[path]),/row-level security/);}
    finally {await db.exec('reset role');}
    await as(landlord);await db.exec('set role authenticated');
    try {
      await db.query("insert into storage.objects(bucket_id,name) values('lease-renewals',$1)",[path]);
      assert.equal((await db.query('select count(*)::int as n from storage.objects where name=$1',[path])).rows[0].n,1);
      assert.equal((await db.query('delete from storage.objects where name=$1 returning name',[path])).rows.length,0);
    } finally {await db.exec('reset role');}
    await as(tenant);await db.exec('set role authenticated');
    try {assert.equal((await db.query('select count(*)::int as n from storage.objects where name=$1',[path])).rows[0].n,0);}
    finally {await db.exec('reset role');}
  });

  await t.test('rejected renewal cash can retry and grants no rent coverage until confirmed', async () => {
    const r=await rental();await request(r);await propose(r);let c=await agree(r);const p=c.proposals[0];
    const pay=()=>db.query(`insert into payment(tenancy_id,apartment_id,tenant_id,renewal_proposal_id,method,amount,period_start)
      values($1,$2,$3,$4,'cash',15000,$5) returning id`,[r.tenancy,r.apartment,tenant,p.id,p.advance_period]);
    const first=(await pay()).rows[0];await as(landlord);await db.query("update payment set status='rejected' where id=$1",[first.id]);
    assert.equal((await context(r,'landlord')).renewal.status,'awaiting_payment');
    assert.equal(Number((await db.query('select app_private.rent_paid_for_period($1,$2) as paid',[r.tenancy,p.advance_period])).rows[0].paid),0);
    await as(tenant);const second=(await pay()).rows[0];assert.notEqual(first.id,second.id);
    await assert.rejects(db.query("update payment set status='paid',advance_amount=1 where id=$1",[second.id]),/cannot be changed/);
  });

  await t.test('only provider authority can confirm online payments; a failed attempt remains retryable', async () => {
    const r=await rental();await request(r);await propose(r);const c=await agree(r),p=c.proposals[0];
    const pay=()=>db.query(`insert into payment(tenancy_id,apartment_id,tenant_id,renewal_proposal_id,method,amount,period_start)
      values($1,$2,$3,$4,'gcash',15000,$5) returning id`,[r.tenancy,r.apartment,tenant,p.id,p.advance_period]);
    await as(tenant);await assert.rejects(pay(),/through checkout/);
    await as('','service_role');const row=(await pay()).rows[0];
    await as(tenant);await assert.rejects(db.query("update payment set status='paid' where id=$1",[row.id]),/payment provider/);
    await as('','service_role');await db.query("update payment set status='failed' where id=$1",[row.id]);
    await as(tenant);assert.equal((await context(r)).renewal.status,'awaiting_payment');
  });

  await t.test('confirmed renewal changes only future terms and does not charge a new deposit', async () => {
    const r=await rental({deposit:15000});await request(r);await propose(r,{retained:15000,advance:0,rent:14000});const c=await agree(r);
    const source=(await db.query('select lease_end::text as ending,monthly_rent,security_deposit from tenancies where id=$1',[r.tenancy])).rows[0];
    assert.equal(source.ending,calendar.ending);assert.equal(Number(source.monthly_rent),15000);assert.equal(Number(source.security_deposit),15000);
    assert.equal(c.leaseEnd,calendar.ending,'a future term must not become current early');
    const future=(await db.query("select app_private.tenancy_bill($1,($2::date+interval '1 month')::date) as bill",[r.tenancy,calendar.starting])).rows[0].bill;
    assert.equal(future.monthlyRent,14000);assert.equal(future.securityDeposit,0);assert.equal(future.advanceRent,0);
    await assert.rejects(db.query("update tenancies set lease_end=lease_end+1 where id=$1",[r.tenancy]),/agreed renewal process/);
    await assert.rejects(db.query("update tenancies set status='ended' where id=$1",[r.tenancy]),/Reconcile the scheduled/);
  });

  await t.test('scheduler retries do not duplicate notices and expiry does not end a tenancy', async () => {
    const r=await rental();await request(r);
    await as('','service_role');
    await db.query('select app_private.check_lease_renewals($1)',[calendar.today]);
    const count=async()=>Number((await db.query("select count(*)::int as n from notifications where data->>'tenancyId'=$1 and title='Lease ending soon'",[r.tenancy])).rows[0].n);
    const first=await count();assert.equal(first,2);
    await db.query('select app_private.check_lease_renewals($1)',[calendar.today]);assert.equal(await count(),first);
    await db.query('select app_private.check_lease_renewals($1::date+1)',[calendar.ending]);
    await as(tenant);assert.equal((await context(r)).renewal.status,'requires_review');
    assert.equal((await db.query('select status from tenancies where id=$1',[r.tenancy])).rows[0].status,'active');
  });
});
