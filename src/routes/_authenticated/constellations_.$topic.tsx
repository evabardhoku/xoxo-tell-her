import { createFileRoute, Link } from '@tanstack/react-router';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QuestionCard } from '@/components/question-feed';
import { PickItem, picksQuery } from '@/components/trusted-picks';
import { shelfQuery } from '@/components/trust-shelf';
import { Echo } from '@/components/echo';
import { pageHead } from '@/lib/metadata';
import { circleQuery } from '@/lib/circle';
import { feedQuery, relativeTime } from '@/lib/askher';
import { feedMapQuery } from '@/lib/perspectives';
import { placeTitle, skyQuery } from '@/lib/constellations';

export const Route = createFileRoute('/_authenticated/constellations_/$topic')({
 head: ({ params }) => pageHead(placeTitle(params.topic), 'Ripples, letters and trusted recommendations from women who’ve been here.'),
 component: Place,
});

type Tab = 'ripples' | 'letters' | 'trusted';
type TopicLetter = { id: string; question_id: string; body: string; where_now: string | null; created_at: string; mine: boolean };

function Place() {
 const { topic } = Route.useParams();
 const feed = useQuery(feedQuery); const maps = useQuery(feedMapQuery); const sky = useQuery(skyQuery);
 const women = useQuery({ queryKey: ['constellation-women', topic], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_constellation_women', { _category: topic }); if (error) throw error; return data as number | null; } });
 const letters = useQuery({ queryKey: ['topic-letters', topic], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_topic_letters', { _category: topic }); if (error) throw error; return (data ?? []) as TopicLetter[]; } });
 const picks = useQuery(picksQuery); const circle = useQuery(circleQuery);
 const direct = (circle.data?.entries ?? []).filter(e => e.kind === 'direct').slice(0, 12);
 const shelves = useQueries({ queries: direct.map(d => shelfQuery(d.member_id)) });
 const [tab, setTab] = useState<Tab>('ripples');

 const ripples = (feed.data ?? []).filter(q => q.category === topic);
 const topicPicks = (picks.data?.circle ?? []).filter(p => p.category === topic);
 const notes = shelves.flatMap((s, i) => (s.data?.notes ?? []).filter(n => n.category === topic).map(n => ({ ...n, member_id: direct[i]!.member_id, by: direct[i]!.first_name })));
 // The Echo action follows the most-echoed Ripple here that isn't the viewer's own.
 const levels = new Map((sky.data ?? []).map(r => [r.id, r.echo_level]));
 const echoTarget = ripples.filter(q => !q.is_mine).sort((a, b) => (levels.get(b.id) ?? 0) - (levels.get(a.id) ?? 0))[0];

 if (feed.isPending) return <p role="status" className="form-note">Finding this constellation…</p>;
 if (!ripples.length) return <section className="empty-panel"><h2>This constellation isn’t visible to you.</h2><p>No Ripples about this have reached you yet.</p><Link to="/home" search={{ view: 'constellations' }} className="member-link">Back to the sky</Link></section>;
 const tabs: { value: Tab; label: string; n: number }[] = [{ value: 'ripples', label: 'Ripples', n: ripples.length }, { value: 'letters', label: 'Letters from the Other Side', n: letters.data?.length ?? 0 }, { value: 'trusted', label: 'From women who’ve been there', n: topicPicks.length + notes.length }];

 return <div className="place">
  <Link to="/home" search={{ view: 'constellations' }} className="back-link"><ArrowLeft size={14} />The sky</Link>
  <header className="place-hero">
   <span className="place-rings" aria-hidden />
   <div className="eyebrow">{topic.toUpperCase()}</div>
   <h1>{placeTitle(topic)}</h1>
   <p className="place-count">{women.data ? `${women.data} women in your network have lived this.` : 'A few women in your network have lived this.'}</p>
   <p className="form-note">Women choose whether to name their Ripple. Echoes and letters stay anonymous.</p>
  </header>
  {echoTarget && <Echo id={echoTarget.id} isAuthor={false} />}
  <div className="segmented" role="tablist" aria-label="In this constellation">
   {tabs.map(t => <button key={t.value} type="button" role="tab" aria-selected={tab === t.value} className="segmented-option" onClick={() => setTab(t.value)}>{t.label}{t.n > 0 && <span className="segmented-count">{t.n}</span>}</button>)}
  </div>
  <div role="tabpanel">
   {tab === 'ripples' && <ul className="question-list">{ripples.map(q => <QuestionCard key={q.id} q={q} counts={maps.data?.[q.id]} />)}</ul>}
   {tab === 'letters' && (letters.data?.length ? <ul className="letter-list">{letters.data.map(l => <li key={l.id} className={`letter-card ${l.mine ? 'letter-card--mine' : ''}`}>
     <p className="letter-body">{l.body}</p>
     <p className="letter-sign">— {l.mine ? 'You' : 'A woman who has been there'}{l.where_now ? `, ${l.where_now}` : ''}</p>
     <div className="letter-foot"><span className="form-note">{relativeTime(l.created_at)}</span><Link to="/askher/$id" params={{ id: l.question_id }} className="member-link text-sm">Read the Ripple it answers</Link></div>
    </li>)}</ul> : <p className="form-note">No letters here yet. Women who echo a Ripple can write one to whoever comes next.</p>)}
   {tab === 'trusted' && (topicPicks.length + notes.length ? <div className="place-trusted">
     {topicPicks.length > 0 && <ul className="list-none p-0 grid gap-3">{topicPicks.map(p => <PickItem key={p.id} p={p} provenance={`Recommended by ${p.recommender}`} />)}</ul>}
     {notes.map(n => <div key={n.id} className="search-item"><div className="question-meta"><span className="question-category">Field Note</span>{n.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{n.location}</span>}</div><strong>{n.title}</strong><p className="search-snippet">{n.body}</p><Link to="/profile/$memberId" params={{ memberId: n.member_id }} className="member-link">{n.by} · Direct Circle</Link></div>)}
    </div> : <p className="form-note">Nothing from your Direct Circle about this yet.</p>)}
  </div>
 </div>;
}
