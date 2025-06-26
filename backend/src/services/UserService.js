const { getDatabase } = require('../database/database');

class UserService {
    constructor() {
        this.db = getDatabase();
    }

    // Create or update user
    async upsertUser(walletAddress) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO users (wallet_address, last_activity)
                VALUES (?, CURRENT_TIMESTAMP)
                ON CONFLICT(wallet_address) DO UPDATE SET
                    last_activity = CURRENT_TIMESTAMP,
                    total_transactions = total_transactions + 1
            `;
            
            this.db.run(query, [walletAddress], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Get user by wallet address
    async getUserByWallet(walletAddress) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM users WHERE wallet_address = ?`;
            
            this.db.get(query, [walletAddress], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Update user gas savings
    async updateGasSavings(walletAddress, gasSaved) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE users 
                SET total_gas_saved = total_gas_saved + ?
                WHERE wallet_address = ?
            `;
            
            this.db.run(query, [gasSaved, walletAddress], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Get user statistics
    async getUserStats(walletAddress) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    u.*,
                    COUNT(t.id) as pending_transactions,
                    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_transactions
                FROM users u
                LEFT JOIN transactions t ON u.wallet_address = t.wallet_address
                WHERE u.wallet_address = ?
                GROUP BY u.id
            `;
            
            this.db.get(query, [walletAddress], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}

module.exports = UserService;
