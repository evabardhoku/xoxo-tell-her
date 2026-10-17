import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { useAccount } from '@/hooks/account';
import { pageHead } from '@/lib/metadata';
import { attestationText, emailSchema, profileSchema } from '@/lib/profile';
import { invitationCode, pendingInvitation, rememberInvitation } from '@/lib/invitation';

export const Route = createFileRoute('/auth')({ validateSearch: (s: Record<string, unknown>): { mode?: 'signin' | 'signup'; invite?: string | undefined } => ({ mode: s['mode'] === 'signup' ? 'signup' : 'signin', ...(invitationCode(s['invite']) ? { invite: invitationCode(s['invite']) } : {}) }), head: () => ({ meta: [...pageHead('Welcome', 'Sign in or create your TellHer account. A little closer. A little wiser.').meta, { name: 'robots', content: 'noindex, nofollow' }, { name: 'referrer', content: 'no-referrer' }] }), component: Auth });
function Auth() {
 const search = Route.useSearch();
 const [invite, setInvite] = useState<string | undefined>(search.invite);
 useEffect(() => { const code = pendingInvitation(search.invite); setInvite(code); if (code) rememberInvitation(code); }, [search.invite]);
 const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(search.mode ?? 'signin'); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [sent, setSent] = useState('');
 async function resend() { setBusy(true); setError(''); try { const { error } = await supabase.auth.resend({ type: 'signup', email: sent, options: { emailRedirectTo: `${window.location.origin}/feed` } }); if (error) throw error; setMessage('A new confirmation email is on its way. Use the newest email only.'); } catch (err) { setError(err instanceof Error ? err.message : 'We couldn’t resend the email. Please try again in a minute.'); } finally { setBusy(false); } }
 useEffect(() => { setMode(search.mode ?? 'signin'); setError(''); setMessage(''); }, [search.mode]);
 const { user, ready } = useAccount(); const navigate = useNavigate();
 useEffect(() => { if (ready && user) void navigate(invite ? { to: '/join', search: { invite }, replace: true } : { to: '/feed', replace: true }); }, [user, ready, navigate, invite]);
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault(); setBusy(true); setError(''); setMessage('');
  const fields = new FormData(event.currentTarget); const password = String(fields.get('password') || '');
  try {
   const email = emailSchema.parse(fields.get('email'));
   if (mode === 'forgot') { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); if (error) throw error; setMessage('If an account exists for this email, you’ll receive a password reset link.'); }
   else if (mode === 'signup') {
    const details = profileSchema.parse({ first_name: fields.get('first_name'), last_name: fields.get('last_name'), city: '', country: '', bio: '', occupation: '', languages: '', known_for: '', ask_me_about: '', discoverability: 'direct', woman_attested: fields.get('woman_attested') === 'on' });
    if (password.length < 8 || password.length > 128) throw new Error('Choose a password between 8 and 128 characters.');
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/feed`, data: { first_name: details.first_name, last_name: details.last_name, woman_attested: true, ...(invite ? { membership_invite: invite } : {}) } } }); if (error) throw error;
    // An existing address returns no identities and no new email is sent.
    if (data.user && data.user.identities?.length === 0) { setMode('signin'); setMessage('This email already has a TellHer account. Sign in below, or use “Forgot password?” if you don’t remember it.'); }
    else { setSent(email); setMessage('Check your email (and your spam folder) and tap the confirmation link. TellHer will open straight to your Feed.'); }
   }
   else { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; }
  } catch (err) { setError(err instanceof Error ? err.message : 'We couldn’t complete that. Please try again.'); } finally { setBusy(false); }
 }
 async function social(provider: 'google' | 'lovable') { setError(''); setBusy(true); try { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth${invite ? `?invite=${encodeURIComponent(invite)}` : ''}` }); if (result.error) throw result.error; } catch (err) { setError(err instanceof Error ? err.message : 'Sign-in couldn’t be completed.'); } finally { setBusy(false); } }
 const changeMode = (next: typeof mode) => { setMode(next); setError(''); setMessage(''); };
 return <main className="auth-page"><Brand /><section className="auth-panel"><div className="eyebrow">A space built on trust</div><h1>{mode === 'signup' ? 'Your circle starts with you.' : mode === 'forgot' ? 'Find your way back.' : 'Welcome to TellHer.'}</h1><p>{mode === 'forgot' ? 'We’ll send a link to reset your password.' : 'A little closer. A little wiser. A space to be yourself.'}</p><form className="account-form" onSubmit={submit}>
 {mode === 'signup' && <div className="grid gap-5 sm:grid-cols-2">{(['first_name', 'last_name'] as const).map(key => <div className="field" key={key}><label htmlFor={key}>{key === 'first_name' ? 'First name' : 'Last name'}</label><Input id={key} name={key} autoComplete={key === 'first_name' ? 'given-name' : 'family-name'} required maxLength={80} /></div>)}</div>}
 <div className="field"><label htmlFor="email">Email address</label><Input id="email" name="email" type="email" autoComplete="email" required maxLength={255} placeholder="you@example.com" /></div>{mode !== 'forgot' && <div className="field"><label htmlFor="password">Password</label><Input id="password" name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={8} maxLength={128} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} /></div>}
 {mode === 'signup' && <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" name="woman_attested" required className="mt-1 size-4 shrink-0 accent-primary" />{attestationText}</label>}
  {mode === 'signup' && <p className="form-note">{invite ? 'Your personal invitation is included. Confirm your email to join; Circle friendships are your choice afterward.' : 'A personal membership invitation is needed to join the community.'}</p>}
 {error && <p role="alert" className="form-note form-error">{error}</p>}{message && <p role="status" className="form-note form-success">{message}</p>}<Button variant="editorial" size="lg" disabled={busy}>{busy ? 'One moment…' : mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Send reset link' : 'Enter TellHer'}<ArrowRight /></Button></form>{mode !== 'forgot' && <><div className="auth-divider">or continue with</div><div className="social-buttons"><Button variant="outline" disabled={busy} onClick={() => social('google')}>Continue with Google</Button><Button className="lovable-auth-button" disabled={busy} onClick={() => social('lovable')}>Continue with Lovable</Button></div></>}<div className="mt-6 flex flex-wrap items-center justify-between gap-2"><Button variant="link" size="sm" onClick={() => changeMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'New here? Create an account' : 'Back to sign in'}</Button>{mode === 'signin' && <Button variant="link" size="sm" onClick={() => changeMode('forgot')}>Forgot password?</Button>}</div><p className="form-note mt-7">Your profile stays private. Share a Ripple anonymously or choose to use your first name.</p><Button asChild variant="link" className="mt-3"><Link to="/">Back to TellHer</Link></Button></section></main>;
}