/** One-shot, in-memory cue so AskHer can play the "Ripple sent" motion after the composer navigates there. */
let sent = false;
export const markRippleSent = () => { sent = true; };
export const consumeRippleSent = () => { const v = sent; sent = false; return v; };
