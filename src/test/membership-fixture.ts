import type { SupabaseClient } from '@supabase/supabase-js';
/** Explicit admission for unrelated integration fixtures, never application signup. */
export async function admitFixture(admin: SupabaseClient, memberId: string) {
 const { error } = await admin.from('member_access').insert({ member_id: memberId, admission_source: 'test_fixture' });
 if (error) throw error;
}
