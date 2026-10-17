import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorText } from '@/lib/askher';
import { deleteMyAccount } from '@/lib/account.functions';

export function PrivacyData({ userId, discoverability, onEditDiscoverability }: { userId: string; discoverability?: string | undefined; onEditDiscoverability: () => void }) {
 const qc = useQueryClient(); const navigate = useNavigate();
 const del = useServerFn(deleteMyAccount);
 const [note, setNote] = useState(''); const [confirm, setConfirm] = useState(''); const [busy, setBusy] = useState(false);

 const clearWingwoman = async () => {
  if (!window.confirm('Delete all your Wingwoman conversations? This cannot be undone.')) return;
  setBusy(true);
  const { error } = await supabase.from('wingwoman_sessions').delete().eq('owner_id', userId);
  setBusy(false); setNote(error ? errorText(error) : 'Your Wingwoman history was deleted.');
  qc.removeQueries({ queryKey: ['ww-sessions'] });
 };
 const exportData = async () => {
  setBusy(true); setNote('');
  try {
  const [profile, sessions, messages, notes, picks] = await Promise.all([
   supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
   supabase.from('wingwoman_sessions').select('*').eq('owner_id', userId),
   supabase.from('wingwoman_messages').select('*').eq('owner_id', userId),
   supabase.from('trust_notes').select('*').eq('author_id', userId),
   supabase.from('trusted_picks').select('*').eq('owner_id', userId),
  ]);
  const failed = [profile, sessions, messages, notes, picks].find(result => result.error);
  if (failed?.error) throw failed.error;
  const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), profile: profile.data, field_notes: notes.data, picks: picks.data, wingwoman_sessions: sessions.data, wingwoman_messages: messages.data }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tellher-my-data.json'; a.click(); URL.revokeObjectURL(a.href);
  setNote('Your data download is ready.');
  } catch { setNote('Your data could not be downloaded. Please try again.'); }
  finally { setBusy(false); }
 };
 const deleteAccount = async () => {
  setBusy(true);
  try { await del({ data: { confirm: 'DELETE' } }); await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: '/', replace: true }); }
  catch (e) { setNote(errorText(e)); setBusy(false); }
 };
 return <section className="account-settings" aria-labelledby="privacy-data"><h2 id="privacy-data">Privacy &amp; data</h2>
  <p className="form-note">Discoverability: {discoverability}</p>
  <div className="flex gap-2 flex-wrap"><Button variant="ghost" onClick={onEditDiscoverability}>Change discoverability</Button>
   <Button variant="ghost" disabled={busy} onClick={() => void exportData()}>Download my data</Button>
   <Button variant="ghost" disabled={busy} onClick={() => void clearWingwoman()}>Delete Wingwoman history</Button></div>
  <p className="form-note">The download includes your profile, Picks, Wingwoman conversations and any archived notes.</p>
  <details className="danger-zone"><summary className="form-note">Delete my account</summary>
   <p className="form-note">This permanently removes your profile, Circle, messages, Wingwoman conversations, replies, letters and archived notes. Anonymous stars you started stay anonymous, with no link back to you.</p>
   <label htmlFor="del-confirm" className="form-note">Type DELETE to confirm</label>
   <Input id="del-confirm" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="off" />
   <Button variant="destructive" className="mt-2" disabled={busy || confirm !== 'DELETE'} onClick={() => void deleteAccount()}>Permanently delete account</Button>
  </details>
  {note && <p role="status" className="form-note">{note}</p>}
 </section>;
}
