import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { admitFixture } from './membership-fixture';
const url=process.env['SUPABASE_URL']; const key=process.env['SUPABASE_SERVICE_ROLE_KEY']; const pub=process.env['SUPABASE_PUBLISHABLE_KEY'];
describe.skipIf(!url || !key || !pub)('Invitation-only membership', () => {
 let admin: SupabaseClient; const clients: SupabaseClient[]=[]; const ids: string[]=[];
 const client=(i:number) => { const c=clients[i]; if(!c) throw new Error('Missing fixture'); return c; };
 const invite=async () => { const r=await client(0).rpc('tellher_create_membership_invite', { _vouch: true }); if(r.error || !r.data?.[0]) throw r.error ?? new Error('No invite'); return r.data[0] as {id:string;code:string;expires_at:string}; };
 beforeAll(async () => {
  if(!url || !key || !pub) throw new Error('Configuration unavailable');
  admin=createClient(url,key,{auth:{persistSession:false}});
  for(let i=0;i<8;i++) {
   const email=`membership-${crypto.randomUUID()}@example.com`; const password=crypto.randomUUID();
   const r=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{first_name:'Member',last_name:'Fixture',woman_attested:true}});
   if(r.error || !r.data.user) throw r.error ?? new Error('No user'); ids.push(r.data.user.id);
   const c=createClient(url,pub,{auth:{persistSession:false}}); const login=await c.auth.signInWithPassword({email,password}); if(login.error) throw login.error; clients.push(c);
  }
  const first=ids[0]; if(!first) throw new Error('Missing sponsor'); await admitFixture(admin,first);
 },90000);
 afterAll(async()=>{ if(!admin) return; for(const id of ids) { const r=await admin.auth.admin.deleteUser(id); if(r.error) throw r.error; } });
 it('inviter must explicitly vouch for the new member',async()=>{expect((await client(0).rpc('tellher_create_membership_invite',{_vouch:false})).error).not.toBeNull();});
 it('email and attestation alone do not grant membership',async()=>{ expect((await client(1).rpc('tellher_enrollment_ready')).data).toBe(true); expect((await client(1).rpc('tellher_member_ready')).data).toBe(false); });
 it('pending accounts cannot view community feeds or profiles or use Wingwoman storage',async()=>{
  const f=await client(1).rpc('tellher_feed'); expect(f.error !== null || f.data?.length===0).toBe(true);
  expect((await client(1).rpc('tellher_member_profile',{_id:ids[0]})).data ?? []).toEqual([]);
  expect((await client(1).from('wingwoman_sessions').insert({owner_id:ids[1],title:'Blocked test'})).error).not.toBeNull();
 });
 it('pending accounts cannot admit themselves or issue invitations',async()=>{
  expect((await client(1).from('member_access').insert({member_id:ids[1]})).error).not.toBeNull();
  expect((await client(1).rpc('tellher_create_membership_invite', { _vouch: true })).error).not.toBeNull();
 });
 it('ordinary one-use and group connection codes cannot admit members',async()=>{
  for(const group of [false,true]) { const r=await client(0).rpc('tellher_create_trust_code',{_group:group}); if(r.error || !r.data?.[0]) throw r.error ?? new Error('No code'); expect((await client(1).rpc('tellher_redeem_membership_invite',{_code:r.data[0].code})).data).toBe('invalid'); }
 });
 it('single-use invitation grants access and privately records the sponsor',async()=>{
  const t=await invite(); expect(t.code).toMatch(/^[A-F0-9]{32}$/);
  const row=await admin.from('trust_codes').select('max_uses,code_hash').eq('id',t.id).single(); if(row.error) throw row.error;
  expect(row.data.max_uses).toBe(1); expect(row.data.code_hash).not.toContain(t.code);
  expect((await client(1).rpc('tellher_redeem_membership_invite',{_code:t.code})).data).toBe('admitted');
  expect((await client(1).rpc('tellher_member_ready')).data).toBe(true);
  expect((await client(1).from('member_access').select('invited_by').single()).data?.invited_by).toBe(ids[0]);
  expect((await client(2).from('member_access').select('*')).data).toEqual([]);
  expect((await client(2).rpc('tellher_redeem_membership_invite',{_code:t.code})).data).toBe('invalid');
 });
 it('cancelled invitation cannot grant membership',async()=>{const t=await invite(); const r=await client(0).rpc('tellher_cancel_trust_code',{_id:t.id}); if(r.error) throw r.error; expect((await client(2).rpc('tellher_redeem_membership_invite',{_code:t.code})).data).toBe('invalid');});
 it('expired invitation cannot grant membership',async()=>{const t=await invite(); const r=await admin.from('trust_codes').update({expires_at:new Date(0).toISOString()}).eq('id',t.id); if(r.error) throw r.error; expect((await client(2).rpc('tellher_redeem_membership_invite',{_code:t.code})).data).toBe('invalid');});
 it('concurrent redemption admits exactly one member',async()=>{const t=await invite(); const results=await Promise.all([2,3].map(i=>client(i).rpc('tellher_redeem_membership_invite',{_code:t.code}))); expect(results.filter(r=>r.data==='admitted')).toHaveLength(1); expect((await admin.from('trust_codes').select('uses').eq('id',t.id).single()).data?.uses).toBe(1);});
 it('self-attestation cannot be removed to bypass enrollment',async()=>{const r=await client(4).from('profiles').update({woman_attested_at:null}).eq('id',ids[4]); expect(r.error).not.toBeNull(); expect((await client(4).rpc('tellher_member_ready')).data).toBe(false);});
 it('repeated guesses are rate limited',async()=>{for(let i=0;i<10;i++) await client(5).rpc('tellher_redeem_membership_invite',{_code:`invalid${i}`}); expect((await client(5).rpc('tellher_redeem_membership_invite',{_code:'invalid'})).data).toBe('rate_limited');});
 it('unconfirmed email accounts cannot sign in or receive membership',async()=>{
  const email=`unconfirmed-${crypto.randomUUID()}@example.com`; const password=crypto.randomUUID();
  const r=await admin.auth.admin.createUser({email,password,email_confirm:false,user_metadata:{first_name:'Unconfirmed',last_name:'Fixture',woman_attested:true}});
  if(r.error || !r.data.user) throw r.error ?? new Error('No unconfirmed fixture'); ids.push(r.data.user.id);
  if(!url || !pub) throw new Error('Configuration unavailable');
  const pending=createClient(url,pub,{auth:{persistSession:false,storageKey:crypto.randomUUID()}});
  const login=await pending.auth.signInWithPassword({email,password});
  expect(login.error?.code).toBe('email_not_confirmed'); expect(login.data.session).toBeNull();
  const receipt=await admin.from('member_access').select('member_id').eq('member_id',r.data.user.id); if(receipt.error) throw receipt.error;
  expect(receipt.data).toEqual([]);
 });
});
