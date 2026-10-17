import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { admitFixture } from './membership-fixture';
const url=process.env['SUPABASE_URL']; const key=process.env['SUPABASE_SERVICE_ROLE_KEY']; const pub=process.env['SUPABASE_PUBLISHABLE_KEY'];
describe.skipIf(!url || !key || !pub)('Open membership (invitations paused)', () => {
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
 it('confirmed, self-attested accounts enter without any invitation',async()=>{ expect((await client(1).rpc('tellher_member_ready')).data).toBe(true); const f=await client(1).rpc('tellher_feed'); expect(f.error).toBeNull(); });
 it('accounts still cannot write their own admission receipt',async()=>{ expect((await client(1).from('member_access').insert({member_id:ids[1]})).error).not.toBeNull(); });
 it('self-attestation cannot be removed to bypass enrollment',async()=>{const r=await client(4).from('profiles').update({woman_attested_at:null}).eq('id',ids[4]); expect(r.error).not.toBeNull(); expect((await admin.from('profiles').select('woman_attested_at').eq('id',ids[4]).single()).data?.woman_attested_at).not.toBeNull();});
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
