import { createFileRoute, redirect } from '@tanstack/react-router';

// The Between Us inbox now lives inside the Circle hub; keep the old address working.
export const Route = createFileRoute('/_authenticated/between-us')({
 beforeLoad: () => { throw redirect({ to: '/circle', search: { view: 'messages' }, replace: true }); },
});
