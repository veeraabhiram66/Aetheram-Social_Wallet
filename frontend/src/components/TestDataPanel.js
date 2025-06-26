import React, { useState, useEffect } from 'react';

const TestDataPanel = ({ onUseTestTransaction, onClearTestTransaction, selectedTransaction }) => {
  const [testData, setTestData] = useState(null);

  useEffect(() => {
    // Try to load test data
    const loadTestData = async () => {
      try {
        // In a real app, you'd fetch this from your backend or load from a file
        // For now, we'll check if it exists
        const response = await fetch('/test-data.json');
        if (response.ok) {
          const data = await response.json();
          setTestData(data);
        }
      } catch (error) {
        console.log('No test data available yet. Run generate-test-data.js first.');
      }
    };

    loadTestData();
  }, []);

  const handleUseTransaction = (transaction) => {
    if (onUseTestTransaction) {
      onUseTestTransaction(transaction);
    }
  };

  const handleClearSelection = () => {
    if (onClearTestTransaction) {
      onClearTestTransaction();
    }
  };

  if (!testData) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          🧪 Test Data Not Available
        </h3>
        <p className="text-yellow-700 mb-3">
          Generate test data first to enable quick testing of gasless transactions.
        </p>
        <div className="bg-yellow-100 rounded p-3 text-sm font-mono">
          <p className="font-semibold mb-1">Run this command:</p>
          <p>cd c:\Users\pveer\Documents\BlockDAG</p>
          <p>node generate-test-data.js</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-blue-800 mb-3">
        🧪 Test Data Available
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-semibold text-blue-700 mb-2">Wallet Info</h4>
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Address:</span> {testData.walletAddress?.slice(0, 10)}...</p>
            <p><span className="font-medium">Guardians:</span> {testData.guardians?.length || 0}</p>
            <p><span className="font-medium">Required:</span> {testData.requiredApprovals || 0} approvals</p>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-blue-700 mb-2">Generated</h4>
          <div className="text-sm">
            <p>{new Date(testData.generated).toLocaleString()}</p>
            <p>{testData.network}</p>
          </div>
        </div>
      </div>
      {/* All test transactions hidden as requested */}
      {/* No test transactions UI */}
      {selectedTransaction && (        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded flex items-center justify-between">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✅ Using test transaction to: <strong>{selectedTransaction.to.slice(0, 10)}...</strong> 
            for <strong>{selectedTransaction.value} BDAG</strong>
          </p>
          <button
            onClick={handleClearSelection}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default TestDataPanel;
