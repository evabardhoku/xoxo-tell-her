export type RippleDraft = {
 category: string;
 body: string;
 scope: string;
 instinct: string;
 note: string;
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