import React, { useState } from 'react';
import { Send, Zap, AlertCircle, Info } from 'lucide-react';
import { Button, Card, Input, Alert } from './UI';

const TxForm = ({ 
  onSubmit, 
  loading, 
  isConnected,
  walletAddress,
  currentNonce = null,
  gasEstimate = null
}) => {
  const [formData, setFormData] = useState({
    to: '',
    value: '0',
    data: '0x'
  });
  const [errors, setErrors] = useState({});
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    // Validate 'to' address
    if (!formData.to) {
      newErrors.to = 'Recipient address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.to)) {
      newErrors.to = 'Invalid Ethereum address';
    }

    // Validate value
    if (formData.value && isNaN(parseFloat(formData.value))) {
      newErrors.value = 'Invalid amount';
    }

    // Validate data (if in advanced mode)
    if (isAdvancedMode && formData.data && !formData.data.startsWith('0x')) {
      newErrors.data = 'Data must start with 0x';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const txData = {
      to: formData.to,
      value: formData.value || '0',
      data: formData.data || '0x'
    };

    onSubmit(txData);
  };

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleQuickFill = (type) => {
    switch (type) {
      case 'test':
        setFormData({
          to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          value: '0.1',
          data: '0x'
        });
        break;
      case 'clear':
        setFormData({ to: '', value: '0', data: '0x' });
        setErrors({});
        break;
      default:
        break;
    }
  };

  if (!isConnected) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">Connect your wallet</p>
          <p className="text-sm">Connect your wallet to send meta-transactions</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center mb-6">
        <Send className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Send Meta-Transaction</h3>
        <Zap className="w-5 h-5 text-yellow-500 ml-2" title="Gasless Transaction" />
      </div>

      {/* Nonce and Gas Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Transaction Details
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <div>Current Nonce: <span className="font-mono font-bold">{currentNonce || 'Loading...'}</span></div>
              {gasEstimate && (
                <div>Estimated Gas: <span className="font-mono font-bold">{gasEstimate}</span></div>
              )}
              <div>Fee: <span className="font-bold text-green-600">FREE (Gasless)</span></div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* To Address */}
        <Input
          label="To Address"
          value={formData.to}
          onChange={handleChange('to')}
          placeholder="0x..."
          error={errors.to}
          required
        />

        {/* Value */}
        <Input
          label="Amount (BDAG)"
          type="number"
          step="0.000001"
          min="0"
          value={formData.value}
          onChange={handleChange('value')}
          placeholder="0.0"
          error={errors.value}
        />

        {/* Advanced Mode Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="advancedMode"
            checked={isAdvancedMode}
            onChange={(e) => setIsAdvancedMode(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="advancedMode" className="text-sm text-gray-700 dark:text-gray-300">
            Advanced: Include transaction data
          </label>
        </div>

        {/* Transaction Data (Advanced) */}
        {isAdvancedMode && (
          <Input
            label="Transaction Data (Hex)"
            value={formData.data}
            onChange={handleChange('data')}
            placeholder="0x"
            error={errors.data}
            helpText="Optional: Contract call data or additional transaction data"
          />
        )}

        {/* Quick Fill Buttons */}
        <div className="flex space-x-2 mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickFill('test')}
            disabled={loading}
            className="bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30 text-green-800 dark:text-green-200"
          >
            🧪 Use Test Data
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickFill('clear')}
            disabled={loading}
          >
            Clear Form
          </Button>
        </div>

        {/* EIP-712 Info Alert */}
        <Alert type="info" className="mb-4">
          <div className="text-sm">
            <strong>Secure Signing:</strong> This transaction uses EIP-712 meta-transaction signing. 
            You'll sign the transaction data, and our relayer will handle the gas fees.
          </div>
        </Alert>

        {/* Submit Button */}
        <Button
          type="submit"
          loading={loading}
          disabled={!formData.to || loading}
          className="w-full"
          size="lg"
        >
          <Zap className="w-5 h-5 mr-2" />
          {loading ? 'Preparing Transaction...' : 'Sign & Send Meta-Transaction'}
        </Button>
      </form>

      {/* Form Status */}
      {formData.to && !errors.to && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm">
            ✅ Ready to send {formData.value || '0'} BDAG to {formData.to.slice(0, 6)}...{formData.to.slice(-4)}
          </p>
        </div>
      )}
    </Card>
  );
};

export default TxForm;
