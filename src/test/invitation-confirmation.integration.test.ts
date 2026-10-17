import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { admitFixture } from './membership-fixture';
const url=process.env['SUPABASE_URL']; const key=process.env['SUPABASE_SERVICE_ROLE_KEY']; const pub=process.env['SUPABASE_PUBLISHABLE_KEY'];
describe.skipIf(!url || !key || !pub)('Signup-bound invitation confirmation', () => {
 let admin: SupabaseClient; let sponsor: SupabaseClient; const ids: string[]=[];
 const makeClient=()=> { if(!url || !pub) throw new Error('Missing config'); return createClient(url,pub,{auth:{persistSession:false}}); };
 beforeAll(async()=>{
  if(!url || !key) throw new Error('Missing config'); admin=createClient(url,key,{auth:{persistSession:false}});
  const email=`sponsor-${crypto.randomUUID()}@example.com`; const password=crypto.randomUUID();
  const r=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{first_name:'Sponsor',last_name:'Test',woman_attested:true}});
  if(r.error || !r.data.user) throw r.error ?? new Error('No sponsor'); ids.push(r.data.user.id); await admitFixture(admin,r.data.user.id);
  sponsor=makeClient(); const login=await sponsor.auth.signInWithPassword({email,password}); if(login.error) throw login.error;
 });
 afterAll(async()=>{if(!admin) return; for(const id of ids) {const r=await admin.auth.admin.deleteUser(id); if(r.error) throw r.error;}});
 async function invite(){const r=await sponsor.rpc('tellher_create_membership_invite',{_vouch:true}); if(r.error || !r.data?.[0]) throw r.error ?? new Error('No invitation'); return r.data[0];}
 async function signup(code:string){
  const r=await admin.auth.admin.generateLink({type:'signup',email:`invite-${crypto.randomUUID()}@example.com`,password:crypto.randomUUID(),options:{data:{first_name:'Invited',last_name:'Test',woman_attested:true,membership_invite:code}}});
  if(r.error || !r.data.user) throw r.error ?? new Error('No signup'); ids.push(r.data.user.id); return r.data;
 }
 it('confirmed email opens membership without another code, browser state, or friendship',async()=>{
  const t=await invite(); const r=await signup(t.code);
  const before=await admin.from('member_access').select('member_id').eq('member_id',r.user.id); if(before.error) throw before.error; expect(before.data).toEqual([]);
  const fresh=makeClient(); const confirmed=await fresh.auth.verifyOtp({token_hash:r.properties.hashed_token,type:'signup'}); if(confirmed.error) throw confirmed.error;
  expect((await fresh.rpc('tellher_member_ready')).data).toBe(true);
  expect((await fresh.rpc('tellher_complete_membership')).data).toBe(true);
  const friends=await admin.from('trust_connections').select('id').or(`requester_id.eq.${r.user.id},recipient_id.eq.${r.user.id}`); if(friends.error) throw friends.error; expect(friends.data).toEqual([]);
  const feed=await fresh.rpc('tellher_feed'); expect(feed.error).toBeNull();
 });
 it('a claimed invite remains valid if its original expiry passes before email verification',async()=>{
  const t=await invite(); const r=await signup(t.code); const exp=await admin.from('trust_codes').update({expires_at:new Date(0).toISOString()}).eq('id',t.id); if(exp.error) throw exp.error;
  const fresh=makeClient(); const confirm=await fresh.auth.verifyOtp({token_hash:r.properties.hashed_token,type:'signup'}); if(confirm.error) throw confirm.error;
  expect((await fresh.rpc('tellher_member_ready')).data).toBe(true);
 });
 it('cancellation still prevents admission after signup',async()=>{
  const t=await invite(); const r=await signup(t.code); const cancel=await sponsor.rpc('tellher_cancel_trust_code',{_id:t.id}); if(cancel.error) throw cancel.error;
  const fresh=makeClient(); const confirm=await fresh.auth.verifyOtp({token_hash:r.properties.hashed_token,type:'signup'}); if(confirm.error) throw confirm.error;
  expect((await fresh.rpc('tellher_member_ready')).data).toBe(false);
 });
 it('the same invite cannot be claimed by a second signup',async()=>{const t=await invite(); await signup(t.code); await expect(signup(t.code)).rejects.toBeDefined();});
});