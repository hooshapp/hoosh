// Isolated PostgreSQL-compatible SQL tests. No remote database connection.
// Install @electric-sql/pglite in a scratch directory, then set PGLITE_MODULE to its dist/index.js.
import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const base=new URL('../../../../services/api/',import.meta.url);
const db=new PGlite();
try {
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key,created_at timestamptz not null default now());
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth to anon,authenticated,service_role;
 insert into auth.users(id) values('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');`);
 for(const name of ['legacy_swift_pilot','study_enrollment','research_categories','productivity_connections']) {
  await db.exec(await readFile(new URL('sql/20261104_'+name+'.sql',base),'utf8'));
 }
 for(const name of ['legacy_swift_rls','study_enrollment_rls','research_categories','productivity_connections']) {
  const result=await db.exec(await readFile(new URL('tests/sql/'+name+'.sql',base),'utf8'));
  console.log(name,JSON.stringify(result.at(-1).rows));
 }
 const result=await db.query('select count(*)::int as participants from legacy_swift_participants');
 if(result.rows[0].participants!==0) throw Error('Fixtures retained');
 console.log('PASS: exact migrations, private researcher views and RLS checks; all isolated fixtures rolled back');
} finally { await db.close(); }
