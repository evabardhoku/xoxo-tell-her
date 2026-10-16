import { createFileRoute, redirect } from '@tanstack/react-router';

// Constellations now lives inside the Sky hub; keep the old address working.
export const Route = createFileRoute('/_authenticated/constellations')({
 beforeLoad: () => { throw redirect({ to: '/home', search: { view: 'constellations' }, replace: true }); },
});
