import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { LockKeyhole } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SignOut } from '@/components/app-shell';
import { pageHead } from '@/lib/metadata';
import { useAccount } from '@/hooks/account';

const profileQuery = { queryKey: ['private-profile'], queryFn: async () => { const { data: auth, error: authError } = await supabase.auth.getUser(); if (authError || !auth.user) throw new Error('Please sign in again.'); const { data, error } = await supabase.from('profiles').select('display_name').eq('id', auth.user.id).single(); if (error) throw error; return data; } };
export const Route = createFileRoute('/_authenticated/profile')({ loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery), head: () => pageHead('Profile', 'Your private TellHer account and profile.'), component: Profile });
function Profile() {
 const { data, refetch } = useSuspenseQuery(profileQuery); const { user } = useAccount(); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
 async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!user) return; setBusy(true); setError(''); setMessage(''); const fields = new FormData(event.currentTarget); const { error } = await supabase.from('profiles').update({ display_name: String(fields.get('display_name')).trim() }).eq('id', user.id); if (error) setError(error.message); else { await refetch(); setMessage('Your profile has been saved.'); } setBusy(false); }
 return <><div className="page-heading"><div><div className="eyebrow">PROFILE</div><h1>A space that’s yours.</h1><p>Your name, your account, your own pace.</p></div></div><section className="profile-panel"><h2>Your private profile</h2><p className="form-note mt-3"><LockKeyhole size={12} className="inline mr-2" />Only you can see these details.</p><form className="account-form" onSubmit={save}><div className="field"><label htmlFor="profile-name">Display name</label><Input id="profile-name" name="display_name" defaultValue={data.display_name} maxLength={80} placeholder="What should we call you?" /></div><div className="field"><label htmlFor="profile-email">Email address</label><Input id="profile-email" value={user?.email || ''} readOnly /></div>{error && <p role="alert" className="form-note form-error">{error}</p>}{message && <p role="status" className="form-note form-success">{message}</p>}<div className="flex justify-between gap-4"><Button variant="editorial" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</Button><SignOut /></div></form><p className="form-note mt-8">Your story is still unfolding. More profile details will have a place here as TellHer grows.</p></section></>;
}