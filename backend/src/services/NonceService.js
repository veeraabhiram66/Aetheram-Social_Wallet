const { getDatabase } = require('../database/database');

class NonceService {
    constructor() {
        this.db = getDatabase();
    }

    // Get current nonce for a wallet
    async getCurrentNonce(walletAddress) {
        return new Promise((resolve, reject) => {
            const query = `SELECT current_nonce FROM nonces WHERE wallet_address = ?`;
            
            this.db.get(query, [walletAddress], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.current_nonce : 0);
                }
            });
        });
    }    // Initialize nonce for new wallet
    async initializeNonce(walletAddress, startingNonce = 0) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR IGNORE INTO nonces (wallet_address, current_nonce)
                VALUES (?, ?)
            `;
            
            this.db.run(query, [walletAddress, startingNonce], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Increment nonce after successful transaction
    async incrementNonce(walletAddress) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE nonces 
                SET current_nonce = current_nonce + 1, updated_at = CURRENT_TIMESTAMP
                WHERE wallet_address = ?
            `;
            
            this.db.run(query, [walletAddress], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Validate nonce for meta-transaction
    async validateNonce(walletAddress, providedNonce) {
        const currentNonce = await this.getCurrentNonce(walletAddress);
        return currentNonce === providedNonce;
    }    // Sync nonce with blockchain (in case of discrepancy)
    async syncNonceWithBlockchain(walletAddress, blockchainNonce) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO nonces (wallet_address, current_nonce, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            `;
            
            this.db.run(query, [walletAddress, blockchainNonce], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }
}

module.exports = NonceService;
