import { createCircuitBreaker } from '../../utils/circuitBreaker.js';

describe('Circuit Breaker', () => {
    describe('createCircuitBreaker', () => {
        it('should execute successful function', async () => {
            const fn = async () => 'success';
            const breaker = createCircuitBreaker(fn, 'test');

            const result = await breaker.fire();
            expect(result).toBe('success');
        });

        it('should open after repeated failures', async () => {
            const fn = async () => {
                throw new Error('fail');
            };

            const breaker = createCircuitBreaker(fn, 'test-fail', {
                errorThresholdPercentage: 50,
                resetTimeout: 10000,
            });

            for (let i = 0; i < 5; i++) {
                try {
                    await breaker.fire();
                } catch {}
            }

            expect(breaker.opened).toBe(true);
        }, 15000);

        it('should not reject when function succeeds', async () => {
            const fn = async () => 42;
            const breaker = createCircuitBreaker(fn, 'test-ok');

            const result = await breaker.fire();
            expect(result).toBe(42);
            expect(breaker.opened).toBe(false);
        });
    });
});
