/** Support resources are configuration, never generated AI text. Only verified, country-neutral resources here. */
export const safetyResources = [
 { label: 'Find a free, confidential helpline in your country', href: 'https://findahelpline.com' },
] as const;

/** Neutral page Quick Exit lands on. */
export const QUICK_EXIT_URL = 'https://www.google.com/search?q=weather';

/** Leave immediately, replacing this entry so Back doesn't return to the sensitive page. */
export function quickExit() {
 try { window.history.replaceState(null, '', '/'); } catch { /* ignore */ }
 window.location.replace(QUICK_EXIT_URL);
}

/** Only explicit immediate-danger phrasing; ordinary conflict never triggers this. */
const riskPatterns = [
 /\b(kill|hurt|harm)(ing)? myself\b/i, /\bsuicid/i, /\bend my life\b/i, /\bwant to die\b/i,
 /\b(going|threaten(ed|ing)?) to kill me\b/i, /\b(he|she|they)('s| is| are) (hitting|choking|beating) me\b/i,
 /\bi('m| am) in danger\b/i, /\bnot safe (right )?now\b/i,
];
export const mentionsImmediateRisk = (text: string) => riskPatterns.some(p => p.test(text));

/** Lightweight check for obvious contact details. It cannot catch every name or address. */
export function detectPii(text: string) {
 const found: string[] = [];
 if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(text)) found.push('an email address');
 if (/(\+?\d[\d\s().-]{7,}\d)/.test(text)) found.push('a phone number');
 if (/(^|\s)@[A-Za-z0-9_.]{3,}/.test(text) || /\b(instagram|tiktok|snapchat|facebook|linkedin|telegram|whatsapp)\.(com|me)\//i.test(text)) found.push('a social handle or contact link');
 return found;
}
