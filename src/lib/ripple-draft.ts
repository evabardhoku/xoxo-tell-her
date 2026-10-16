export type RippleDraft = {
 category: string;
 body: string;
 scope: string;
 instinct: string;
 note: string;
 author_visibility?: 'anonymous' | 'named';
};

// Explicit allowlist: private Wingwoman source/context never enters publication.
export function ripplePublication(draft: RippleDraft) {
 return {
  _category: draft.category,
  _body: draft.body.trim(),
  _scope: draft.scope,
  _instinct: draft.instinct,
  _note: draft.note.trim() || null as unknown as string,
 };
}
export function rippleIdentityPublication(draft: RippleDraft) { return { ...ripplePublication(draft), _author_visibility: draft.author_visibility ?? 'anonymous' }; }
export type ExcerptLine = { role: 'you' | 'wingwoman'; text: string };
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);
/** Concise private reminder of a Wingwoman conversation: opening situation plus the last few turns, each clipped. */
export function conversationExcerpt(situation: string, messages: { role: string; content: string }[], keep = 4) {
 const recent = messages.slice(-keep);
 return {
  opening: clip(situation.trim(), 400),
  omitted: Math.max(0, messages.length - recent.length),
  lines: recent.map(m => ({ role: m.role === 'user' ? 'you' : 'wingwoman', text: clip(m.content.trim(), 220) }) as ExcerptLine),
 };
}
