# BlockDAG Smart Wallet Backend

A production-ready relayer backend for gasless meta-transactions with EIP-712 signature verification, persistent storage, and comprehensive security features.

## 🚀 Features

### Core Functionality
- **EIP-712 Meta-Transaction Relay** - Secure signature verification and transaction execution
- **Nonce Management** - Replay attack prevention with database-backed nonce tracking
- **Rate Limiting** - Multi-tier rate limiting (IP, wallet, endpoint-specific)
- **Transaction Logging** - Complete audit trail of all meta-transactions
- **Real-time Analytics** - Gas savings tracking and usage statistics

### Security Features
- **Input Validation** - Comprehensive Joi-based validation for all endpoints
- **Rate Limiting** - Express-rate-limit + custom database-backed limiting
- **Security Headers** - Helmet.js protection with custom security middleware
- **Error Handling** - Structured error responses with development/production modes
- **Signature Verification** - Multiple EIP-712 verification methods with fallbacks

### Database Features
- **SQLite Storage** - Lightweight, persistent storage for production use
- **Optimized Schema** - Indexed tables for fast queries and analytics
- **Graceful Migrations** - Automatic schema setup and future migration support
- **Connection Pooling** - Efficient database connection management

## 📦 Database Schema

### Tables
- `users` - Wallet owners and usage statistics
- `nonces` - Replay protection and nonce tracking
- `transactions` - Complete transaction audit log
- `recovery_requests` - Social recovery request tracking
- `rate_limits` - Custom rate limiting with IP/wallet tracking
- `analytics` - System metrics and usage analytics

## 🛠 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Ensure your `.env` file contains:
```env
BLOCKDAG_RPC_URL=https://rpc.primordial.bdagscan.com
DEPLOYER_PRIVATE_KEY=your_private_key_here
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### 3. Initialize Database
```bash
npm run db:setup
```

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Core Endpoints

#### `POST /relay`
Execute meta-transaction with EIP-712 signature verification.

**Request:**
```json
{
  "walletAddress": "0x742d35Cc6754C00532D5a3a2323c10f6bF3e96E8",
  "to": "0x1234567890123456789012345678901234567890",
  "value": "0",
  "data": "0x",
  "nonce": 5,
  "signature": "0x1234...5678"
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0xabcd...ef01",
  "gasUsed": 21000,
  "gasSaved": 0.001,
  "message": "Meta-transaction executed successfully"
}
```

#### `GET /wallet?address=0x...`
Get wallet information, balance, and statistics.

#### `GET /transactions?address=0x...&limit=20&offset=0`
Get transaction history for a wallet.

#### `GET /transaction/:txHash`
Get status of a specific transaction.

#### `GET /health`
Health check with system status and statistics.

### Rate Limits
- **General API**: 100 requests/15min per IP
- **Relay Endpoint**: 10 requests/5min per IP+wallet
- **Recovery**: 3 requests/hour per IP
- **Burst Protection**: 20 requests/minute per IP

## 🔒 Security Features

### Input Validation
All endpoints use Joi schema validation:
- Address format validation (0x + 40 hex chars)
- Signature format validation (0x + 130 hex chars)
- Numeric value validation with type coercion
- Data sanitization and unknown field stripping

### Rate Limiting
Multi-tier protection:
- Express-rate-limit for standard protection
- Custom database-backed limiting for advanced scenarios
- IP + wallet address combination keys
- Configurable windows and limits per endpoint

### Error Handling
- Structured error responses
- Development vs production error detail levels
- Request/response logging with performance metrics
- Graceful shutdown handling

## 🧪 Testing

### Backend Health Test
```bash
node test-backend.js
```

### Manual Testing
```bash
# Health check
curl http://localhost:4000/health

# API info
curl http://localhost:4000/

# Wallet info (will fail without deployed contracts)
curl "http://localhost:4000/wallet?address=0x742d35Cc6754C00532D5a3a2323c10f6bF3e96E8"
```

## 📊 Monitoring

### Health Check Response
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "database": "connected",
    "blockchain": "connected",
    "chainId": 1043
  },
  "stats": {
    "totalTransactions": 0,
    "pendingTransactions": 0,
    "totalGasSaved": 0
  }
}
```

### Request Logging
All requests are logged with:
- Method, URL, IP address
- Response status and timing
- Error details (development mode)

## 🔧 Configuration

### Environment Variables
- `BLOCKDAG_RPC_URL` - BlockDAG RPC endpoint
- `DEPLOYER_PRIVATE_KEY` - Private key for paying gas
- `PORT` - Server port (default: 4000)
- `FRONTEND_URL` - CORS origin for frontend
- `NODE_ENV` - Environment mode (development/production)

### Smart Contract Integration
After deploying contracts, update `.env`:
```env
SMART_WALLET_FACTORY_ADDRESS=0x...
SMART_WALLET_IMPLEMENTATION_ADDRESS=0x...
```

## 🚀 Production Deployment

### Before Deployment
1. Remove test private keys from `.env`
2. Set `NODE_ENV=production`
3. Configure proper RPC endpoints
4. Set up monitoring and logging
5. Configure reverse proxy (nginx/Apache)
6. Set up SSL certificates

### Performance Notes
- SQLite handles ~100K transactions efficiently
- Consider PostgreSQL for high-volume production
- Database cleanup runs automatically for old transactions
- Rate limiting uses in-memory + database hybrid approach

## 🔮 Future Enhancements

### Phase 2 Features
- Guardian dashboard endpoints
- Social recovery workflow API
- Webhook notifications
- Advanced analytics API
- Session key management
- Batch transaction support

### Scaling Considerations
- Redis for rate limiting at scale
- PostgreSQL for production database
- Horizontal backend scaling
- CDN for static assets
- Monitoring and alerting integration
