const Joi = require('joi');

// Validation schemas
const schemas = {
    // Meta-transaction relay request
    relayTransaction: Joi.object({
        to: Joi.string()
            .pattern(/^0x[a-fA-F0-9]{40}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid "to" address format'
            }),
        
        value: Joi.alternatives()
            .try(
                Joi.string().pattern(/^\d+$/),
                Joi.number().min(0)
            )
            .required()
            .messages({
                'alternatives.match': 'Value must be a valid number or string number'
            }),
        
        data: Joi.string()
            .pattern(/^0x[a-fA-F0-9]*$/)
            .default('0x')
            .messages({
                'string.pattern.base': 'Data must be valid hex string'
            }),
        
        nonce: Joi.alternatives()
            .try(
                Joi.string().pattern(/^\d+$/),
                Joi.number().min(0)
            )
            .required()
            .messages({
                'alternatives.match': 'Nonce must be a valid number or string number'
            }),
        
        signature: Joi.string()
            .pattern(/^0x[a-fA-F0-9]{130}$/)
            .required()
            .messages({
                'string.pattern.base': 'Signature must be a valid 65-byte hex string'
            }),
        
        walletAddress: Joi.string()
            .pattern(/^0x[a-fA-F0-9]{40}$/)
            .required()
            .messages({
                'string.pattern.base': 'Invalid wallet address format'
            })
    }),

    // Recovery request validation
    recoveryRequest: Joi.object({
        walletAddress: Joi.string()
            .pattern(/^0x[a-fA-F0-9]{40}$/)
            .required(),
        
        newOwner: Joi.string()
            .pattern(/^0x[a-fA-F0-9]{40}$/)
            .required(),
        
        guardianSignature: Joi.string()
            .pattern(/^0x[a-fA-F0-9]{130}$/)
            .required()
    }),

    // Wallet query parameters
    walletQuery: Joi.object({
        address: Joi.string()
            .pattern(/^0x[a-fA-F0-9]{40}$/)
            .required(),
        
        limit: Joi.number()
            .min(1)
            .max(100)
            .default(20),
        
        offset: Joi.number()
            .min(0)
            .default(0)
    })
};

// Validation middleware factory
function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });

        if (error) {
            const errorMessages = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errorMessages
            });
        }

        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
    };
}

// Query parameter validation
function validateQuery(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });

        if (error) {
            const errorMessages = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Query validation failed',
                details: errorMessages
            });
        }

        req.query = value;
        next();
    };
}

// Security headers middleware
function securityHeaders(req, res, next) {
    // Remove server signature
    res.removeHeader('X-Powered-By');
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    next();
}

// Request logging middleware
function requestLogger(req, res, next) {
    const start = Date.now();
    const { method, url, ip } = req;
    
    // Log request
    console.log(`📥 ${method} ${url} - ${ip} - ${new Date().toISOString()}`);
    
    // Log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        const statusEmoji = statusCode < 400 ? '✅' : statusCode < 500 ? '⚠️' : '❌';
        
        console.log(`📤 ${statusEmoji} ${method} ${url} - ${statusCode} - ${duration}ms`);
    });
    
    next();
}

// Error handling middleware
function errorHandler(err, req, res, next) {
    console.error('❌ Error:', err);

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';
    let details = null;

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
        details = err.message;
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
    } else if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        message = 'File too large';
    }

    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production') {
        details = null;
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(details && { details })
    });
}

module.exports = {
    schemas,
    validate,
    validateQuery,
    securityHeaders,
    requestLogger,
    errorHandler
};
