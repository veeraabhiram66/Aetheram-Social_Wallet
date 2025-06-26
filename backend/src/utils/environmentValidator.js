/**
 * Environment Variable Validation Utility
 * Ensures all required environment variables are properly set
 */

class EnvironmentValidator {
    static requiredVariables = [
        'BLOCKDAG_RPC_URL',
        'DEPLOYER_PRIVATE_KEY',
        'SMART_WALLET_FACTORY_ADDRESS'
    ];

    static optionalVariables = [
        'PORT',
        'FRONTEND_URL',
        'NODE_ENV',
        'TEST_EOA_ADDRESS',
        'TEST_SMART_WALLET_ADDRESS',
        'SMART_WALLET_IMPLEMENTATION_ADDRESS'
    ];

    /**
     * Validate all required environment variables
     * @throws {Error} If any required variable is missing
     */
    static validateRequired() {
        const missing = [];
        
        for (const varName of this.requiredVariables) {
            if (!process.env[varName]) {
                missing.push(varName);
            }
        }

        if (missing.length > 0) {
            throw new Error(
                `Missing required environment variables: ${missing.join(', ')}\n` +
                'Please check your .env file and ensure all required variables are set.'
            );
        }
    }

    /**
     * Validate environment variable formats
     * @throws {Error} If any variable has invalid format
     */
    static validateFormats() {
        const errors = [];

        // Validate Ethereum addresses
        const addressVariables = [
            'SMART_WALLET_FACTORY_ADDRESS',
            'SMART_WALLET_IMPLEMENTATION_ADDRESS',
            'TEST_EOA_ADDRESS',
            'TEST_SMART_WALLET_ADDRESS'
        ];

        for (const varName of addressVariables) {
            const value = process.env[varName];
            if (value && !this.isValidEthereumAddress(value)) {
                errors.push(`${varName} is not a valid Ethereum address: ${value}`);
            }
        }

        // Validate private key format
        const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
        if (privateKey && !this.isValidPrivateKey(privateKey)) {
            errors.push('DEPLOYER_PRIVATE_KEY is not a valid private key format');
        }

        // Validate RPC URL
        const rpcUrl = process.env.BLOCKDAG_RPC_URL;
        if (rpcUrl && !this.isValidUrl(rpcUrl)) {
            errors.push(`BLOCKDAG_RPC_URL is not a valid URL: ${rpcUrl}`);
        }

        // Validate port
        const port = process.env.PORT;
        if (port && !this.isValidPort(port)) {
            errors.push(`PORT is not a valid port number: ${port}`);
        }

        if (errors.length > 0) {
            throw new Error('Environment variable validation failed:\n' + errors.join('\n'));
        }
    }

    /**
     * Validate all environment variables
     */
    static validateAll() {
        console.log('🔍 Validating environment variables...');
        
        try {
            this.validateRequired();
            this.validateFormats();
            console.log('✅ Environment variables validation passed');
        } catch (error) {
            console.error('❌ Environment validation failed:', error.message);
            throw error;
        }
    }

    /**
     * Log environment variable status (without exposing sensitive values)
     */
    static logStatus() {
        console.log('📋 Environment Variables Status:');
        
        // Required variables
        console.log('  Required:');
        for (const varName of this.requiredVariables) {
            const status = process.env[varName] ? '✅ Set' : '❌ Missing';
            console.log(`    ${varName}: ${status}`);
        }

        // Optional variables
        console.log('  Optional:');
        for (const varName of this.optionalVariables) {
            const status = process.env[varName] ? '✅ Set' : '⚪ Not set';
            console.log(`    ${varName}: ${status}`);
        }
    }

    // Validation helper methods
    static isValidEthereumAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    static isValidPrivateKey(key) {
        return /^0x[a-fA-F0-9]{64}$/.test(key) || /^[a-fA-F0-9]{64}$/.test(key);
    }

    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static isValidPort(port) {
        const num = parseInt(port);
        return !isNaN(num) && num > 0 && num <= 65535;
    }
}

module.exports = EnvironmentValidator;
