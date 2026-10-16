/** Stable anonymous labels inside an Echo Room: 0 is the Ripple author, others are numbered in order of first message. */
export const voiceLabel = (voice: number) => (voice === 0 ? 'Original Poster' : `Voice ${voice}`);
