const { getDatabase } = require('../database/database');

class TransactionService {
    constructor() {
        this.db = getDatabase();
    }

    // Create new transaction record
    async createTransaction(transactionData) {
        return new Promise((resolve, reject) => {
            const {
                walletAddress,
                toAddress,
                value,
                data,
                nonce,
                signature,
                status = 'pending'
            } = transactionData;

            const query = `
                INSERT INTO transactions (
                    wallet_address, to_address, value, data, nonce, signature, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(query, [
                walletAddress, toAddress, value, data, nonce, signature, status
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, transactionId: this.lastID });
                }
            });
        });
    }

    // Update transaction with blockchain result
    async updateTransactionResult(transactionId, result) {
        return new Promise((resolve, reject) => {
            const {
                txHash,
                status,
                gasUsed,
                gasPrice,
                gasSaved,
                errorMessage
            } = result;

            const query = `
                UPDATE transactions 
                SET tx_hash = ?, status = ?, gas_used = ?, gas_price = ?, 
                    gas_saved = ?, executed_at = CURRENT_TIMESTAMP, error_message = ?
                WHERE id = ?
            `;
            
            this.db.run(query, [
                txHash, status, gasUsed, gasPrice, gasSaved, errorMessage, transactionId
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Get transaction by ID
    async getTransactionById(transactionId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM transactions WHERE id = ?`;
            
            this.db.get(query, [transactionId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Get transactions for a wallet
    async getTransactionsByWallet(walletAddress, limit = 50, offset = 0) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM transactions 
                WHERE wallet_address = ? 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `;
            
            this.db.all(query, [walletAddress, limit, offset], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get pending transactions
    async getPendingTransactions(limit = 100) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM transactions 
                WHERE status = 'pending' 
                ORDER BY created_at ASC 
                LIMIT ?
            `;
            
            this.db.all(query, [limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Get transaction statistics
    async getTransactionStats(walletAddress = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    COUNT(*) as total_transactions,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
                    AVG(gas_saved) as avg_gas_saved,
                    SUM(gas_saved) as total_gas_saved
                FROM transactions
            `;
            
            const params = [];
            if (walletAddress) {
                query += ` WHERE wallet_address = ?`;
                params.push(walletAddress);
            }
            
            this.db.get(query, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Clean up old transactions (older than 30 days)
    async cleanupOldTransactions(daysToKeep = 30) {
        return new Promise((resolve, reject) => {
            const query = `
                DELETE FROM transactions 
                WHERE created_at < datetime('now', '-${daysToKeep} days')
                AND status IN ('completed', 'failed')
            `;
            
            this.db.run(query, [], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ deletedCount: this.changes });
                }
            });
        });
    }
}

module.exports = TransactionService;
