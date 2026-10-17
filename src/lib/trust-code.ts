/** Friendly, neutral copy for Trust Code results. Blocks are never named as the reason. */
export function trustCodeMessage(status: string, firstName: string | null) {
 switch (status) {
  case 'connected': return `You and ${firstName ?? 'she'} are now in each other’s Circle. Good people are worth keeping.`;
  case 'already': return 'You’re already connected.';
  case 'expired': return 'This code has expired. Ask her to show you a new one — it only takes a moment.';
  case 'own': return 'This is your own code. Share it with the woman you’re with.';
  case 'rate_limited': return 'Too many tries. Please wait a few minutes and try again.';
  case 'not_ready': return 'Finish setting up your profile first, then use the code.';
  case 'unavailable': return 'This code can’t be used with this account.';
  default: return 'This code isn’t valid. Check it and try again.';
 }
}
