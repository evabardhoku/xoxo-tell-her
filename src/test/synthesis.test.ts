import { describe, it, expect } from 'vitest';
import { synthesisReady } from '@/lib/synthesis.functions';
const r = (b: string) => ({ body: b });
describe('synthesis threshold', () => {
 it('needs at least 3 meaningful replies', () => expect(synthesisReady([r('I would talk to her directly first'), r('Maybe wait a week and see what changes')])).toBe(false));
 it('ignores duplicates and very short replies', () => expect(synthesisReady([r('Talk to her directly about it'), r('talk to her  directly about it'), r('ok'), r('Ask for more context first')])).toBe(false));
 it('enables with 3 distinct meaningful replies', () => expect(synthesisReady([r('Talk to her directly about it'), r('Wait a little and observe more'), r('I went through the same at work')])).toBe(true));
});
