const isProduction = process.env.NODE_ENV === 'production';

const logger = {
    error: (message, ...args) => {
        if (!isProduction) {
            console.error(message, ...args);
        }
        // TODO: Integrate with error reporting service (e.g., Sentry) in production
    },
    warn: (message, ...args) => {
        if (!isProduction) {
            console.warn(message, ...args);
        }
    },
    log: (message, ...args) => {
        if (!isProduction) {
            console.log(message, ...args);
        }
    },
    info: (message, ...args) => {
        if (!isProduction) {
            console.info(message, ...args);
        }
    }
};

export default logger;
