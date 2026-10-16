import { RippleAuthor } from '@/components/ripple-author';
import { FieldNoteContext } from '@/components/field-note-context';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { useState, type FormEvent } from 'react';
import { MapPin, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pageHead } from '@/lib/metadata';
import { memberAvatar } from '@/lib/member.functions';
import { reachContext, relativeTime } from '@/lib/askher';
import { matchTopics, relationLabel, searchQuery, type SearchRow } from '@/lib/search';

export const Route = createFileRoute('/_authenticated/search')({
 validateSearch: zodValidator(z.object({ q: fallback(z.string(), '').default('') })),
 head: () => pageHead('Search', 'Search people, Field Notes, picks and questions you can already see on TellHer.'),
 component: SearchPage,
});

function SearchPage() {
 const { q } = Route.useSearch(); const navigate = useNavigate({ from: '/search' });
 const [text, setText] = useState(q);
 const term = q.slice(0, 80);
 const res = useQuery(searchQuery(term));
 const submit = (e: FormEvent) => { e.preventDefault(); navigate({ search: { q: text.trim() } }); };
 const rows = res.data ?? [];
 type Group = SearchRow['kind'] | 'open' | 'anon';
 const of = (k: Group) => k === 'open' ? rows.filter(r => r.kind === 'question' && r.author_visibility === 'named') : k === 'anon' ? rows.filter(r => r.kind === 'question' && r.author_visibility !== 'named') : rows.filter(r => r.kind === k);
 const topics = matchTopics(term);
 const groups: [string, Group][] = [['People', 'person'], ['Open Ripples', 'open'], ['Anonymous Ripples', 'anon'], ['Field Notes', 'note'], ['Picks', 'pick']];
 return <>
  <div className="page-heading"><div><div className="eyebrow">SEARCH</div><h1>Search</h1><p>Find what’s already shared with you.</p></div></div>
  <form className="search-bar" onSubmit={submit} role="search"><label htmlFor="global-q" className="sr-only">Search TellHer</label><Input id="global-q" value={text} maxLength={80} onChange={e => setText(e.target.value)} placeholder="A name, a city, a topic…" autoFocus /><Button type="submit" variant="editorial"><SearchIcon />Search</Button></form>
  {term.trim().length < 2 ? <p className="form-note">Type at least two characters.</p>
   : res.isPending ? <p role="status" className="form-note">Searching…</p>
   : res.isError ? <p role="alert" className="form-note form-error">Search isn’t available right now. Please try again.</p>
   : <div className="search-groups">
    {topics.length > 0 && <section className="search-group"><h2>Topics</h2><ul className="tag-list">{topics.map(t => <li key={t}><Link to="/askher" search={{ category: t }}>{t}</Link></li>)}</ul></section>}
    {groups.map(([label, k]) => of(k).length > 0 && <section key={k} className="search-group"><h2>{label}</h2><ul className="search-list">{of(k).map(r => <Result key={`${r.kind}-${r.id}`} r={r} />)}</ul></section>)}
    {!rows.length && !topics.length && <p className="form-note">Nothing you can see matches “{term}”.</p>}
   </div>}
 </>;
}

function Result({ r }: { r: SearchRow }) {
 if (r.kind === 'person') return <PersonResult r={r} />;
 if (r.kind === 'question') return <li className="search-item"><div className="question-meta"><span className="question-category">{r.category}</span><span>{reachContext(r.audience_scope ?? '')}</span>{r.created_at && <span>{relativeTime(r.created_at)}</span>}</div><RippleAuthor identity={r} /><Link to="/askher/$id" params={{ id: r.id }} className="question-link"><p>{r.body}</p></Link><span className="form-note">{r.reply_count ?? 0} perspectives</span></li>;
 const who = r.relation === 'self' ? <span>Yours</span> : r.member_id ? <Link to="/profile/$memberId" params={{ memberId: r.member_id }} className="member-link">{r.kind === 'pick' ? `Recommended by ${r.member_name}` : `From ${r.member_name}`}</Link> : null;
 return <li className="search-item"><div className="question-meta"><span className="question-category">{r.category}</span>{r.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{r.location}</span>}<span>{relationLabel(r.relation)}</span></div><strong>{r.title}</strong><p className="search-snippet">{r.body}</p>{who}{r.kind === 'note' && <FieldNoteContext id={r.id} />}</li>;
}

function PersonResult({ r }: { r: SearchRow }) {
 const avatar = useQuery({ queryKey: ['member-avatar', r.member_id], enabled: Boolean(r.has_avatar), queryFn: () => memberAvatar({ data: { id: r.member_id ?? '' } }), staleTime: 240000 });
 const [first, last = ''] = (r.title ?? '').split(' ');
 return <li className="search-item search-person"><span className="member-avatar ext-avatar" aria-hidden>{avatar.data?.url ? <img src={avatar.data.url} alt="" /> : first?.slice(0, 1).toUpperCase()}</span>
  <div className="member-meta"><Link to="/profile/$memberId" params={{ memberId: r.member_id ?? '' }} className="member-link"><strong>{first} {last.length === 1 ? `${last}.` : last}</strong></Link>{r.location && <span><MapPin size={12} className="inline mr-1" />{r.location}</span>}
   <span className="trust-context">{relationLabel(r.relation)}</span>{(r.known_for?.length ?? 0) > 0 && <span className="form-note">Known for {(r.known_for ?? []).join(', ')}</span>}</div></li>;
}
