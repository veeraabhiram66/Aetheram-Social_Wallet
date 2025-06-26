/**
 * EIP-712 Signing Utilities
 * Provides typed data signing for meta-transactions
 */

import { ethers } from 'ethers';

/**
 * Domain separator for EIP-712
 */
export const createDomain = (verifyingContract, chainId = 1) => ({
  name: 'SimpleWallet',
  version: '1',
  chainId: chainId,
  verifyingContract: verifyingContract,
});

/**
 * Types for meta-transaction
 */
export const META_TRANSACTION_TYPES = {
  MetaTransaction: [
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'data', type: 'bytes' },
    { name: 'nonce', type: 'uint256' },
  ],
};

/**
 * Create EIP-712 typed data for meta-transaction
 */
export const createMetaTransactionData = (
  walletAddress,
  to,
  value,
  data,
  nonce,
  chainId = 1
) => {
  return {
    domain: createDomain(walletAddress, chainId),
    types: META_TRANSACTION_TYPES,
    primaryType: 'MetaTransaction',
    message: {
      to: to,
      value: value.toString(),
      data: data || '0x',
      nonce: nonce.toString(),
    },
  };
};

/**
 * Sign meta-transaction using EIP-712
 */
export const signMetaTransaction = async (
  signer,
  walletAddress,
  to,
  value,
  data,
  nonce,
  chainId = 1
) => {
  try {
    const typedData = createMetaTransactionData(
      walletAddress,
      to,
      value,
      data,
      nonce,
      chainId
    );

    console.log('📝 Signing EIP-712 typed data:', typedData);

    // Sign the typed data
    const signature = await signer.signTypedData(
      typedData.domain,
      typedData.types,
      typedData.message
    );

    console.log('✅ Signature created:', signature);

    return {
      success: true,
      signature,
      typedData,
    };
  } catch (error) {
    console.error('❌ EIP-712 signing failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign meta-transaction',
    };
  }
};

/**
 * Verify meta-transaction signature
 */
export const verifyMetaTransactionSignature = (
  signature,
  walletAddress,
  to,
  value,
  data,
  nonce,
  expectedSigner,
  chainId = 1
) => {
  try {
    const typedData = createMetaTransactionData(
      walletAddress,
      to,
      value,
      data,
      nonce,
      chainId
    );

    const recoveredAddress = ethers.verifyTypedData(
      typedData.domain,
      typedData.types,
      typedData.message,
      signature
    );

    const isValid = recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();

    return {
      success: true,
      isValid,
      recoveredAddress,
      expectedSigner,
    };
  } catch (error) {
    console.error('❌ Signature verification failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify signature',
    };
  }
};

/**
 * Get transaction hash for meta-transaction
 */
export const getMetaTransactionHash = (
  walletAddress,
  to,
  value,
  data,
  nonce,
  chainId = 1
) => {
  const typedData = createMetaTransactionData(
    walletAddress,
    to,
    value,
    data,
    nonce,
    chainId
  );

  return ethers.TypedDataEncoder.hash(
    typedData.domain,
    typedData.types,
    typedData.message
  );
};

/**
 * Format transaction for display
 */
export const formatMetaTransaction = (txData) => {
  return {
    to: txData.to,
    value: ethers.formatEther(txData.value || '0'),
    data: txData.data || '0x',
    nonce: txData.nonce?.toString() || '0',
    dataLength: txData.data ? txData.data.length : 2,
    isContractCall: txData.data && txData.data !== '0x',
  };
};

const eip712Utils = {
  createDomain,
  META_TRANSACTION_TYPES,
  createMetaTransactionData,
  signMetaTransaction,
  verifyMetaTransactionSignature,
  getMetaTransactionHash,
  formatMetaTransaction,
};

export default eip712Utils;
