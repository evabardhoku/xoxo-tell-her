import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { pageHead } from '@/lib/metadata';
import { errorText, relativeTime } from '@/lib/askher';

export const Route = createFileRoute('/_authenticated/admin/reports')({ head: () => ({ ...pageHead('Reports', 'Moderation queue.'), meta: [...pageHead('Reports', 'Moderation queue.').meta, { name: 'robots', content: 'noindex' }] }), component: Reports });

const statusLabel: Record<string, string> = { open: 'Open', reviewed: 'Reviewed', actioned: 'Actioned', dismissed: 'Dismissed' };
const targetLabel: Record<string, string> = { ripple: 'Ripple', perspective: 'Perspective', letter: 'Letter', shared_space: 'Shared space message', message: 'Private message' };

function Reports() {
 const qc = useQueryClient(); const [error, setError] = useState('');
 // Authorization is enforced by the database function; this page only renders what it returns.
 const q = useQuery({ queryKey: ['mod-reports'], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_mod_reports'); if (error) throw error; return data ?? []; }, retry: false });
 const act = async (id: string, action: 'reviewed' | 'dismissed' | 'remove') => {
  if (action === 'remove' && !window.confirm('Remove this content for everyone?')) return;
  setError(''); const { error } = await supabase.rpc('tellher_mod_act', { _report: id, _action: action });
  if (error) setError(errorText(error)); await qc.invalidateQueries({ queryKey: ['mod-reports'] });
 };
 if (q.isPending) return <p role="status" className="form-note">Loading reports…</p>;
 if (q.isError) return <section className="empty-panel"><h1>This page isn’t available.</h1><p>It’s only for TellHer moderators.</p><Button asChild variant="editorial" className="mt-6"><Link to="/home">Back to Sky</Link></Button></section>;
 return <>
  <div className="page-heading"><div><div className="eyebrow">MODERATION</div><h1>Reports</h1><p className="form-note">Content only. Reporter and author identities are never shown here.</p></div></div>
  {error && <p role="alert" className="form-note form-error">{error}</p>}
  {q.data.length === 0 ? <p className="form-note">No reports.</p> : <ul className="mod-list">{q.data.map(r => <li key={r.id} className="circle-card">
   <div className="question-meta"><span className="question-category">{targetLabel[r.target_type] ?? r.target_type}</span><span>{statusLabel[r.status] ?? r.status}</span><span>{relativeTime(r.created_at)}</span></div>
   <p><strong>Reason:</strong> {r.reason}</p>
   {r.content && <blockquote className="mod-content">{r.content}</blockquote>}
   {r.status === 'open' && <div className="flex gap-2 flex-wrap mt-2">
    <Button size="sm" variant="outline" onClick={() => void act(r.id, 'reviewed')}>Mark reviewed</Button>
    <Button size="sm" variant="ghost" onClick={() => void act(r.id, 'dismissed')}>Dismiss</Button>
    <Button size="sm" variant="destructive" onClick={() => void act(r.id, 'remove')}>Remove content</Button>
   </div>}
  </li>)}</ul>}
 </>;
}
