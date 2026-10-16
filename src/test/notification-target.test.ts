import { describe, it, expect } from 'vitest';
import { notificationTarget, notificationTitle } from '@/lib/notifications';
describe('notification destinations', () => {
 it('circle request opens My Circle requests', () => expect(notificationTarget({ kind: 'trust_request', link: '/circle' })).toEqual({ to: '/circle', search: { view: 'requests' } }));
 it('message opens its thread', () => expect(notificationTarget({ kind: 'message', link: '/between-us/abc' })).toEqual({ to: '/between-us/abc' }));
 it('ripple notifications keep their Ripple', () => expect(notificationTarget({ kind: 'letter', link: '/askher/q1' })).toEqual({ to: '/askher/q1' }));
 it('retired names are renamed', () => expect(notificationTitle('New message in Between Us')).toBe('New message'));
});
