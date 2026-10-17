import { mentionsImmediateRisk } from '@/lib/safety';

/** TellHer's narrator signature. Used only in a few deliberate places. */
export const SIGNATURE = 'XOXO, TellHer';

/** Topics where playful supporting copy must step aside for calm, neutral language. */
const heavy = /\b(abus\w*|violen\w*|assault\w*|rap(e|ed)|hit(s|ting)? me|stalk\w*|threat\w*|self[- ]harm|suicid\w*|overdose|trauma\w*|ptsd|cancer|diagnos\w*|miscarriage|pregnan\w*|lawyer|police|court|custody|lawsuit|divorce|danger\w*|unsafe|grief|died|death)\b/i;

/** True when the text touches something serious; the narrator should go quiet. */
export const isSensitive = (...texts: (string | null | undefined)[]) => texts.some(t => !!t && (heavy.test(t) || mentionsImmediateRisk(t)));
