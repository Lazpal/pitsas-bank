// Production configuration - Κρύψιμο debug messages
window.PRODUCTION_MODE = true;

// Production logger που κρύβει τα debug messages
window.logger = {
    log: function(...args) {
        if (!window.PRODUCTION_MODE || process.env.NODE_ENV === 'development') {
            console.log(...args);
        }
    },
    warn: function(...args) {
        console.warn(...args);
    },
    error: function(...args) {
        console.error(...args);
    },
    debug: function(...args) {
        if (!window.PRODUCTION_MODE || process.env.NODE_ENV === 'development') {
            console.log('[DEBUG]', ...args);
        }
    }
};
