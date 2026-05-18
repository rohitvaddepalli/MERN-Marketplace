import CircuitBreaker from 'opossum';

const defaultOptions = {
    timeout: 10000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    name: 'default',
};

export const createCircuitBreaker = (asyncFn, name, overrides = {}) => {
    const breaker = new CircuitBreaker(asyncFn, {
        ...defaultOptions,
        ...overrides,
        name: name || defaultOptions.name,
    });

    breaker.on('open', () => console.warn(`[CircuitBreaker] ${breaker.name} opened`));
    breaker.on('halfOpen', () => console.info(`[CircuitBreaker] ${breaker.name} half-open`));
    breaker.on('close', () => console.info(`[CircuitBreaker] ${breaker.name} closed`));
    breaker.on('timeout', () => console.warn(`[CircuitBreaker] ${breaker.name} timeout`));
    breaker.on('reject', () => console.warn(`[CircuitBreaker] ${breaker.name} rejected`));

    return breaker;
};

export const handleWithBreaker = async (breaker, ...args) => {
    try {
        return await breaker.fire(...args);
    } catch (err) {
        if (err.name === 'CircuitBreakerError' || err.name === 'OpenError') {
            const serviceError = new Error(`Service ${breaker.name} is unavailable`);
            serviceError.statusCode = 503;
            serviceError.service = breaker.name;
            throw serviceError;
        }
        throw err;
    }
};
