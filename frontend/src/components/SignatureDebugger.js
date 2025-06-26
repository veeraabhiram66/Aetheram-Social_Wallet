import React, { useState } from 'react';
import { ethers } from 'ethers';

const SignatureDebugger = ({ walletService, isConnected, account }) => {  const [testParams, setTestParams] = useState({
    walletAddress: '0xdC10A6aCdA956363300f8a63C7CDEdc74100Fad8', // Use the correct smart wallet from backend env
    to: '0x742d35Cc6754C00532D5a3a2323c10f6bF3e96E8',
    value: '0',
    data: '0x',
    nonce: 5
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testSignature = async () => {
    if (!isConnected || !walletService) {
      setResult({ error: 'Wallet not connected' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 Starting signature test...');
      
      const signResult = await walletService.signMetaTransaction(
        testParams.walletAddress,
        testParams.to,
        testParams.value,
        testParams.data,
        parseInt(testParams.nonce)
      );

      if (signResult.success) {
        // Additional verification
        const domain = signResult.domain;
        const types = signResult.types;
        const message = signResult.message;
        const signature = signResult.signature;

        // Verify locally
        const recoveredSigner = ethers.verifyTypedData(domain, types, message, signature);
        
        setResult({
          success: true,
          signature,
          domain,
          types,
          message,
          recoveredSigner,
          currentAccount: account,
          valid: recoveredSigner.toLowerCase() === account.toLowerCase(),
          signatureLength: signature.length,
          signatureFormat: signature.startsWith('0x') && signature.length === 132
        });
      } else {
        setResult({ error: signResult.error });
      }
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const updateParam = (key, value) => {
    setTestParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-4">
      <h3 className="text-xl font-bold text-white mb-4">🔐 EIP-712 Signature Debugger</h3>
      
      {/* Test Parameters */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Wallet Address</label>
          <input
            type="text"
            value={testParams.walletAddress}
            onChange={(e) => updateParam('walletAddress', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
            placeholder="0x..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">To Address</label>
          <input
            type="text"
            value={testParams.to}
            onChange={(e) => updateParam('to', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
            placeholder="0x..."
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Value (Wei)</label>
            <input
              type="text"
              value={testParams.value}
              onChange={(e) => updateParam('value', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
              placeholder="0"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Data</label>
            <input
              type="text"
              value={testParams.data}
              onChange={(e) => updateParam('data', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
              placeholder="0x"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nonce</label>
            <input
              type="number"
              value={testParams.nonce}
              onChange={(e) => updateParam('nonce', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
              placeholder="5"
            />
          </div>
        </div>
      </div>

      {/* Test Button */}
      <button
        onClick={testSignature}
        disabled={!isConnected || loading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          !isConnected || loading
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? '🔄 Testing Signature...' : '🧪 Test EIP-712 Signature'}
      </button>

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {result.error ? (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
              <h4 className="text-red-400 font-medium mb-2">❌ Error</h4>
              <p className="text-red-300 text-sm font-mono">{result.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status */}
              <div className={`border rounded-lg p-4 ${
                result.valid ? 'bg-green-900/50 border-green-500' : 'bg-yellow-900/50 border-yellow-500'
              }`}>
                <h4 className={`font-medium mb-2 ${result.valid ? 'text-green-400' : 'text-yellow-400'}`}>
                  {result.valid ? '✅ Signature Valid' : '⚠️ Signature Invalid'}
                </h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-400">Current Account:</span> <span className="font-mono text-white">{result.currentAccount}</span></p>
                  <p><span className="text-gray-400">Recovered Signer:</span> <span className="font-mono text-white">{result.recoveredSigner}</span></p>
                  <p><span className="text-gray-400">Match:</span> <span className={result.valid ? 'text-green-400' : 'text-red-400'}>{result.valid ? 'Yes' : 'No'}</span></p>
                </div>
              </div>

              {/* Signature Details */}
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">📝 Signature Details</h4>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="text-gray-400">Signature:</span>
                    <div className="font-mono text-xs text-green-400 mt-1 break-all bg-gray-900 p-2 rounded">
                      {result.signature}
                    </div>
                  </div>
                  <p><span className="text-gray-400">Length:</span> <span className="text-white">{result.signatureLength}</span> <span className={result.signatureFormat ? 'text-green-400' : 'text-red-400'}>({result.signatureFormat ? 'Valid' : 'Invalid'} format)</span></p>
                </div>
              </div>

              {/* EIP-712 Data */}
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">📋 EIP-712 Data</h4>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-gray-400">Domain:</span>
                    <pre className="text-green-400 mt-1 bg-gray-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.domain, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="text-gray-400">Message:</span>
                    <pre className="text-blue-400 mt-1 bg-gray-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.message, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SignatureDebugger;
