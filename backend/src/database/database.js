const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/blockchain.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

// Initialize database schema
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Users table - track wallet owners
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_address TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                total_transactions INTEGER DEFAULT 0,
                total_gas_saved REAL DEFAULT 0.0
            )`);

            // Nonces table - prevent replay attacks
            db.run(`CREATE TABLE IF NOT EXISTS nonces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_address TEXT NOT NULL,
                current_nonce INTEGER NOT NULL DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(wallet_address)
            )`);

            // Transactions table - log all meta-transactions
            db.run(`CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tx_hash TEXT UNIQUE,
                wallet_address TEXT NOT NULL,
                to_address TEXT NOT NULL,
                value TEXT NOT NULL,
                data TEXT,
                nonce INTEGER NOT NULL,
                signature TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                gas_used INTEGER,
                gas_price TEXT,
                gas_saved REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                executed_at DATETIME,
                error_message TEXT
            )`);

            // Recovery requests table - track social recovery
            db.run(`CREATE TABLE IF NOT EXISTS recovery_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_address TEXT NOT NULL,
                current_owner TEXT NOT NULL,
                new_owner TEXT NOT NULL,
                guardian_address TEXT NOT NULL,
                approvals_count INTEGER NOT NULL DEFAULT 0,
                required_approvals INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                finalized_at DATETIME
            )`);

            // Rate limiting table - prevent abuse
            db.run(`CREATE TABLE IF NOT EXISTS rate_limits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip_address TEXT NOT NULL,
                wallet_address TEXT,
                endpoint TEXT NOT NULL,
                request_count INTEGER NOT NULL DEFAULT 1,
                window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_request DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Analytics table - track system metrics
            db.run(`CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT NOT NULL,
                metric_value REAL NOT NULL,
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Create indexes for better performance
            db.run(`CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_nonces_wallet ON nonces(wallet_address)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_address)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_recovery_wallet ON recovery_requests(wallet_address)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip_address)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_analytics_metric ON analytics(metric_name)`);

            console.log('✅ Database schema initialized successfully');
            resolve();
        });
    });
}

// Get database instance
function getDatabase() {
    return db;
}

// Close database connection
function closeDatabase() {
    return new Promise((resolve) => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('✅ Database connection closed');
            }
            resolve();
        });
    });
}

module.exports = {
    initializeDatabase,
    getDatabase,
    closeDatabase,
    DB_PATH
};
