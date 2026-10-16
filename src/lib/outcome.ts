/** Calm, non-judgmental outcome options for "The Other Side". Values mirror the database check. */
export const outcomeStatuses = [
 { value: 'boundary', label: 'I set a boundary' },
 { value: 'moved_forward', label: 'I moved forward' },
 { value: 'observed', label: 'I stayed and observed' },
 { value: 'talked', label: 'I talked to someone I trust' },
 { value: 'left', label: 'I decided to leave' },
 { value: 'figuring_out', label: 'I am still figuring it out' },
 { value: 'other', label: 'Other' },
] as const;
export const outcomeLabel = (v: string | null) => outcomeStatuses.find(s => s.value === v)?.label ?? null;
export type Outcome = { status: string | null; summary: string; note: string | null; shared: boolean; updated_at: string; is_mine: boolean };
