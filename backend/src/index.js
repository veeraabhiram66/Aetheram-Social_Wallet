// NOTE: Only bypass SSL in development mode for local testing
// NEVER use this in production environments
if (process.env.NODE_ENV === 'development' && process.env.ALLOW_SSL_BYPASS === 'true') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.warn('⚠️ SSL certificate validation disabled for development');
}

require('dotenv').config();

// Validate environment variables before starting
const EnvironmentValidator = require('./utils/environmentValidator');
try {
    EnvironmentValidator.validateAll();
    EnvironmentValidator.logStatus();
} catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

// Add global error handlers
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    console.error('Stack:', reason?.stack);
});

// Database
const { initializeDatabase, closeDatabase } = require('./database/database');

// Middleware
const { 
    validate, 
    validateQuery, 
    schemas, 
    securityHeaders, 
    requestLogger, 
    errorHandler 
} = require('./middleware/validation');

const { 
    generalLimiter, 
    relayLimiter, 
    recoveryLimiter, 
    burstLimiter,
    CustomRateLimiter 
} = require('./middleware/rateLimiting');

// Controllers
const RelayController = require('./controllers/RelayController');

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize controller with error handling
let relayController;
try {
    console.log('🔄 Initializing RelayController...');
    relayController = new RelayController();
    console.log('✅ RelayController initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize RelayController:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
}

// Trust proxy (for rate limiting with correct IPs)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for API
    crossOriginEmbedderPolicy: false
}));
app.use(securityHeaders);

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
}));

// Request parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// General rate limiting
app.use(generalLimiter);

// Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'BlockDAG Smart Wallet Backend API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            relay: 'POST /relay - Execute meta-transaction',
            wallet: 'GET /wallet?address=0x... - Get wallet info',
            transactions: 'GET /transactions?address=0x... - Get transaction history',
            status: 'GET /transaction/:txHash - Get transaction status',
            health: 'GET /health - Health check'
        }
    });
});

// Health check endpoint
app.get('/health', relayController.healthCheck.bind(relayController));

// Meta-transaction relay endpoint (with strict rate limiting)
app.post('/relay', 
    relayLimiter,
    validate(schemas.relayTransaction),
    relayController.relayTransaction.bind(relayController)
);

// Wallet information endpoint
app.get('/wallet',
    burstLimiter,
    validateQuery(schemas.walletQuery),
    relayController.getWalletInfo.bind(relayController)
);

// Transaction history endpoint
app.get('/transactions',
    burstLimiter,
    validateQuery(schemas.walletQuery),
    relayController.getTransactionHistory.bind(relayController)
);

// Transaction status endpoint
app.get('/transaction/:txHash',
    burstLimiter,
    relayController.getTransactionStatus.bind(relayController)
);

// Get current nonce for a wallet
app.get('/nonce',
    generalLimiter,
    relayController.getCurrentNonce.bind(relayController)
);

// Debug wallet transactions and nonce status
app.get('/debug/wallet',
    generalLimiter,
    relayController.debugWalletTransactions.bind(relayController)
);

// Recovery endpoints (placeholder for future implementation)
app.post('/recovery/initiate',
    recoveryLimiter,
    (req, res) => {
        res.status(501).json({
            success: false,
            error: 'Recovery endpoints not implemented yet',
            message: 'Social recovery will be implemented in the next phase'
        });
    }
);

// Analytics endpoint (protected, placeholder)
app.get('/analytics',
    generalLimiter,
    (req, res) => {
        res.status(501).json({
            success: false,
            error: 'Analytics endpoints not implemented yet',
            message: 'Analytics dashboard will be implemented in the next phase'
        });
    }
);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
        availableEndpoints: [
            'GET /',
            'GET /health',
            'POST /relay',
            'GET /wallet',
            'GET /transactions',
            'GET /transaction/:txHash'
        ]
    });
});

// Initialize database and start server
async function startServer() {
    try {
        console.log('🚀 Starting BlockDAG Smart Wallet Backend...');
        
        // Initialize database
        console.log('📦 Initializing database...');
        await initializeDatabase();
        
        // Start server
        const server = app.listen(PORT, () => {
            console.log(`✅ Backend server running on port ${PORT}`);
            console.log(`🌐 Health check: http://localhost:${PORT}/health`);
            console.log(`📖 API docs: http://localhost:${PORT}/`);
            console.log(`⚡ Ready to process meta-transactions!`);
        });

        // Graceful shutdown handling
        const gracefulShutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
            
            server.close(async () => {
                console.log('📡 HTTP server closed');
                
                try {
                    await closeDatabase();
                    console.log('✅ Graceful shutdown completed');
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error during shutdown:', error);
                    process.exit(1);
                }
            });
        };

        // Listen for termination signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            process.exit(1);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
