import { describe, expect, it } from 'vitest';
import { rippleDestination } from '@/lib/ripple-identity';

describe('Ripple return destinations', () => {
 it('returns named Ripples to My Feed', () => { expect(rippleDestination('named')).toBe('/feed'); });
 it('returns anonymous Ripples to Sky', () => { expect(rippleDestination('anonymous')).toBe('/home'); });
 it('keeps historical Ripples in Sky', () => { expect(rippleDestination()).toBe('/home'); });
});