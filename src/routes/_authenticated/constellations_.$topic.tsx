import { createFileRoute, Link } from '@tanstack/react-router';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QuestionCard } from '@/components/question-feed';
import { PickItem, picksQuery } from '@/components/trusted-picks';
import { shelfQuery } from '@/components/trust-shelf';
import { FieldNoteContext } from '@/components/field-note-context';
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

type TopicLetter = { id: string; question_id: string; body: string; where_now: string | null; created_at: string; mine: boolean };

function Place() {
 const { topic } = Route.useParams();
 const feed = useQuery(feedQuery); const maps = useQuery(feedMapQuery); const sky = useQuery(skyQuery);
 const women = useQuery({ queryKey: ['constellation-women', topic], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_constellation_women', { _category: topic }); if (error) throw error; return data as number | null; } });
 const letters = useQuery({ queryKey: ['topic-letters', topic], queryFn: async () => { const { data, error } = await supabase.rpc('tellher_topic_letters', { _category: topic }); if (error) throw error; return (data ?? []) as TopicLetter[]; } });
 const picks = useQuery(picksQuery); const circle = useQuery(circleQuery);
 const direct = (circle.data?.entries ?? []).filter(e => e.kind === 'direct').slice(0, 12);
 const shelves = useQueries({ queries: direct.map(d => shelfQuery(d.member_id)) });

 const ripples = (feed.data ?? []).filter(q => q.category === topic);
 const topicPicks = (picks.data?.circle ?? []).filter(p => p.category === topic);
 const notes = shelves.flatMap((s, i) => { const owner = direct[i]; return owner ? (s.data?.notes ?? []).filter(n => n.category === topic).map(n => ({ ...n, member_id: owner.member_id, by: owner.first_name })) : []; });
 // The Echo action follows the most-echoed Ripple here that isn't the viewer's own.
 const levels = new Map((sky.data ?? []).map(r => [r.id, r.echo_level]));
 const echoTarget = ripples.filter(q => !q.is_mine).sort((a, b) => (levels.get(b.id) ?? 0) - (levels.get(a.id) ?? 0))[0];

 if (feed.isPending) return <p role="status" className="form-note">Finding this constellation…</p>;
 if (!ripples.length) return <section className="empty-panel"><h2>This constellation isn’t visible to you.</h2><p>No Ripples about this have reached you yet.</p><Link to="/home" search={{ view: 'constellations' }} className="member-link">Back to the sky</Link></section>;

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
  <section className="member-section"><h2>Ripples</h2><ul className="question-list">{ripples.map(q => <QuestionCard key={q.id} q={q} counts={maps.data?.[q.id]} />)}</ul></section>
  {(Boolean(letters.data?.length) || topicPicks.length > 0 || notes.length > 0) && <section className="member-section"><h2>From women who’ve been there</h2>
   {letters.data?.length ? <><h3 className="picks-sub mb-3">Letters from the Other Side</h3><ul className="letter-list">{letters.data.map(l => <li key={l.id} className={`letter-card ${l.mine ? 'letter-card--mine' : ''}`}>
     <p className="letter-body">{l.body}</p>
     <p className="letter-sign">— {l.mine ? 'You' : 'A woman who has been there'}{l.where_now ? `, ${l.where_now}` : ''}</p>
     <div className="letter-foot"><span className="form-note">{relativeTime(l.created_at)}</span><Link to="/askher/$id" params={{ id: l.question_id }} className="member-link text-sm">Read the Ripple it answers</Link></div>
    </li>)}</ul></> : null}
   {topicPicks.length + notes.length ? <div className="place-trusted">
     {topicPicks.length > 0 && <ul className="list-none p-0 grid gap-3">{topicPicks.map(p => <PickItem key={p.id} p={p} provenance={`Recommended by ${p.recommender}`} />)}</ul>}
     {notes.map(n => <div key={n.id} className="shelf-note"><div className="question-meta"><span className="question-category">Field Note</span>{n.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{n.location}</span>}</div><h4>{n.title}</h4><p>{n.body}</p><Link to="/profile/$memberId" params={{ memberId: n.member_id }} className="member-link">{n.by} · Direct Circle</Link><FieldNoteContext id={n.id} /></div>)}
    </div> : null}
   {!letters.data?.length && !topicPicks.length && !notes.length && <p className="form-note">No Field Notes, Letters or Picks shared here yet.</p>}
  </section>}
 </div>;
}
