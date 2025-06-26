const rateLimit = require('express-rate-limit');

// General API rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for meta-transaction relay
const relayLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // limit each IP to 10 relay requests per 5 minutes
    message: {
        success: false,
        error: 'Too many relay requests from this IP, please try again later.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Custom key generator to also consider wallet address
    keyGenerator: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        const wallet = req.body?.walletAddress || 'unknown';
        return `${ip}:${wallet}`;
    }
});

// Very strict rate limiting for recovery requests
const recoveryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 recovery requests per hour
    message: {
        success: false,
        error: 'Too many recovery requests from this IP, please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Burst protection for high-frequency endpoints
const burstLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // limit each IP to 20 requests per minute
    message: {
        success: false,
        error: 'Request rate too high, please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Custom rate limiter with database tracking
class CustomRateLimiter {
    constructor(database) {
        this.db = database;
    }

    // Check rate limit for specific endpoint and IP/wallet combination
    async checkRateLimit(ip, walletAddress, endpoint, maxRequests, windowMinutes) {
        return new Promise((resolve, reject) => {
            const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
            
            const query = `
                SELECT COUNT(*) as request_count
                FROM rate_limits 
                WHERE ip_address = ? 
                AND (wallet_address = ? OR wallet_address IS NULL)
                AND endpoint = ?
                AND window_start > ?
            `;
            
            this.db.get(query, [ip, walletAddress, endpoint, windowStart.toISOString()], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const currentCount = row ? row.request_count : 0;
                const allowed = currentCount < maxRequests;
                
                resolve({
                    allowed,
                    currentCount,
                    maxRequests,
                    windowMinutes,
                    resetTime: new Date(Date.now() + windowMinutes * 60 * 1000)
                });
            });
        });
    }

    // Record a request in the rate limiting table
    async recordRequest(ip, walletAddress, endpoint) {
        return new Promise((resolve, reject) => {
            // Clean up old records first
            const cleanupQuery = `
                DELETE FROM rate_limits 
                WHERE window_start < datetime('now', '-24 hours')
            `;
            
            this.db.run(cleanupQuery, [], (err) => {
                if (err) {
                    console.warn('Failed to cleanup old rate limit records:', err);
                }
            });

            // Insert new record
            const insertQuery = `
                INSERT INTO rate_limits (ip_address, wallet_address, endpoint, request_count)
                VALUES (?, ?, ?, 1)
            `;
            
            this.db.run(insertQuery, [ip, walletAddress, endpoint], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    // Create middleware for custom rate limiting
    createLimiter(endpoint, maxRequests, windowMinutes) {
        return async (req, res, next) => {
            try {
                const ip = req.ip || req.connection.remoteAddress;
                const walletAddress = req.body?.walletAddress || null;
                
                const rateLimitResult = await this.checkRateLimit(
                    ip, walletAddress, endpoint, maxRequests, windowMinutes
                );
                
                if (!rateLimitResult.allowed) {
                    return res.status(429).json({
                        success: false,
                        error: 'Rate limit exceeded',
                        details: {
                            endpoint,
                            currentCount: rateLimitResult.currentCount,
                            maxRequests: rateLimitResult.maxRequests,
                            windowMinutes: rateLimitResult.windowMinutes,
                            resetTime: rateLimitResult.resetTime
                        }
                    });
                }
                
                // Record this request
                await this.recordRequest(ip, walletAddress, endpoint);
                
                // Add rate limit info to response headers
                res.set({
                    'X-RateLimit-Limit': maxRequests,
                    'X-RateLimit-Remaining': maxRequests - rateLimitResult.currentCount - 1,
                    'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime.getTime() / 1000)
                });
                
                next();
                
            } catch (error) {
                console.error('Rate limiting error:', error);
                // Don't block request if rate limiting fails
                next();
            }
        };
    }
}

module.exports = {
    generalLimiter,
    relayLimiter,
    recoveryLimiter,
    burstLimiter,
    CustomRateLimiter
};
