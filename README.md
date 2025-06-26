# 🚀 Blockchain Smart Wallet with Social Recovery

**Gasless Transactions • Social Recovery • Scalable Backend System Design**

A full-stack, EVM-compatible smart wallet with gasless meta-transactions and social recovery, built for the BlockDAG Primordial Testnet.

![Demo](https://img.shields.io/badge/Demo-Live-brightgreen) ![Build](https://img.shields.io/badge/Build-Passing-brightgreen) ![Tests](https://img.shields.io/badge/Tests-36%2F36-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

### 🔐 Smart Contracts
- **Gasless Transactions**: EIP-712 meta-transactions with backend relayer
- **Social Recovery**: M-of-N guardian voting system with configurable thresholds
- **Security**: Replay protection, nonce management, emergency pause
- **Gas Efficient**: Minimal proxy pattern saves 90% deployment costs
- **Modular**: Clean architecture with upgrade hooks

### 🖥️ Backend Services (Node.js, Express.js, SQL, REST API, system design)
- **Relayer:** Node.js service to securely verify EIP-712 signatures and relay gasless transactions  
- **Database:** SQLite for user accounts and transaction history, structured for easy migration to MySQL  
- **API:** RESTful endpoints built with Express.js, featuring modular routes, input validation, and error handling  
- **Security:** Rate limiting, CORS, security headers, and request sanitization to protect APIs  
- **Monitoring:** Health checks, logging, analytics, and basic caching for improved performance  

### 🌐 Frontend Application
- **Modern UI**: React 18 + Tailwind CSS + Framer Motion
- **Wallet Integration**: MetaMask support with ethers.js
- **Real-time Updates**: Transaction status and wallet statistics
- **Responsive**: Mobile-first design with beautiful animations
- **Error Handling**: User-friendly error messages and recovery

## 🎯 Live Demo

1. **Start Backend**: `cd backend && npm start`
2. **Start Frontend**: `cd frontend && npm start`
3. **Open Browser**: http://localhost:3000
4. **Connect Wallet**: MetaMask with BlockDAG Primordial Testnet
5. **Send Gasless Transaction**: No native tokens required!

## 🏗️ Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- BlockDAG testnet tokens

### Installation

```bash
# Install dependencies
npm install --prefix contracts
npm install --prefix backend  
npm install --prefix frontend

# Set up environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your configuration
```

### Deploy Contracts

```bash
cd contracts

# Compile contracts
npx hardhat compile

# Deploy to BlockDAG testnet
npx hardhat run scripts/deployFactory.js --network blockdag

# Update .env files with deployed addresses
```

### Start Services

```bash
# Terminal 1: Backend
cd backend
npm run db:setup
npm start

# Terminal 2: Frontend
cd frontend
npm start
```

### Test Everything

```bash
# Run integration tests
node test-integration.js

# Run demo script
node demo-script.js
```

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
npx hardhat test
# 36/36 tests passing ✅
```

### Backend Services
```bash
cd backend
node test-backend.js
# All endpoints tested ✅
```

### Frontend Build
```bash
cd frontend
npm run build
# Build successful ✅
```

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js, SQLite (MySQL-ready), REST APIs
- **Frontend:** React 18, Tailwind CSS, Framer Motion
- **Smart Contracts:** Solidity, Hardhat
- **Design:** Modular architecture, scalable API + DB layers, relayer separation

## 🚀 Project Highlights  

This project demonstrates:  
- 💡 **Innovation:** Gasless wallet with social recovery and meta-transaction support  
- 🔧 **Technical Strength:** Secure, production-ready Node.js + Express.js backend with REST APIs and SQL integration  
- 🏗️ **System Design:** Modular architecture separating API, database, and relayer layers for scalability  
- 🛡️ **Security:** Rate limiting, input validation, CORS, replay protection, and nonce management  
- 📄 **Completeness:** Full-stack solution with documentation and test coverage  


---

**Built for the BlockDAG Hackathon**
