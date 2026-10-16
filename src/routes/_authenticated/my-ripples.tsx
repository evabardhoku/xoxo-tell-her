import { createFileRoute, redirect } from '@tanstack/react-router';

// My Ripples now lives inside the Ask hub; keep the old address working.
export const Route = createFileRoute('/_authenticated/my-ripples')({
 beforeLoad: () => { throw redirect({ to: '/askher', search: { view: 'ripples' }, replace: true }); },
});
