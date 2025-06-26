import React, { useState, useEffect } from 'react';
import { Send, Zap, AlertCircle } from 'lucide-react';
import { Button, Card, Input, Alert } from './UI';

const TransactionForm = ({ 
  onSubmit, 
  loading, 
  isConnected,
  walletAddress,
  initialValues = {} // Add support for initial values
}) => {
  console.log('TransactionForm rendered with initialValues:', initialValues);
  
  const [formData, setFormData] = useState({
    to: '',  // Start with empty value
    value: '0',
    data: ''
  });
  const [errors, setErrors] = useState({});

  // Update form data when initialValues change
  useEffect(() => {
    console.log('useEffect triggered with initialValues:', initialValues);
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        to: initialValues.to || '',
        value: initialValues.value || '0',
        data: initialValues.data || ''
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate recipient address
    if (!formData.to) {
      newErrors.to = 'Recipient address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.to)) {
      newErrors.to = 'Invalid address format';
    }

    // Validate value
    if (formData.value && isNaN(Number(formData.value))) {
      newErrors.value = 'Invalid amount';
    }

    // Validate data (if provided)
    if (formData.data && formData.data !== '') {
      if (!formData.data.startsWith('0x')) {
        newErrors.data = 'Data must start with 0x';
      } else if (!/^0x[a-fA-F0-9]*$/.test(formData.data)) {
        newErrors.data = 'Invalid hex data';
      }
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
  };  const handleQuickFill = (type) => {
    console.log('Quick fill clicked:', type);
    switch (type) {
      case 'test':
        console.log('Setting test data with CORRECT address');
        const testData = {
          to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // CORRECT ADDRESS
          value: '0.1',
          data: '0x'
        };
        console.log('Test data being set:', testData);
        setFormData(testData);
        setErrors({}); // Clear any errors
        break;
      case 'clear':
        setFormData({ to: '', value: '0', data: '' });
        setErrors({});
        break;
      default:
        break;
    }
  };

  if (!isConnected) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>Connect your wallet to send transactions</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center mb-6">
        <Send className="w-6 h-6 text-blue-600 mr-3" />
        <h3 className="text-xl font-bold text-gray-900">Send Transaction</h3>
        <Zap className="w-5 h-5 text-yellow-500 ml-2" title="Gasless Transaction" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">        <Input
          label="To Address"
          name="to"
          value={formData.to}
          onChange={handleChange}
          placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
          error={errors.to}
          disabled={loading}
        />

        <Input
          label="Amount (BDAG)"
          name="value"
          type="number"
          step="0.000001"
          min="0"
          value={formData.value}
          onChange={handleChange}
          placeholder="0.0"
          error={errors.value}
          disabled={loading}
        />

        <Input
          label="Data (Optional)"
          name="data"
          value={formData.data}
          onChange={handleChange}
          placeholder="0x"
          error={errors.data}
          disabled={loading}
        />

        <div className="flex space-x-2 mb-4">          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickFill('test')}
            disabled={loading}
            className="bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30 text-green-800 dark:text-green-200"
          >
            🧪 Use Fixed Test Data
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

        <Alert type="info" className="mb-4">
          <div className="text-sm">
            <strong>Gasless Transaction:</strong> This transaction will be paid for by our relayer. 
            You only need to sign the transaction - no gas fees required!
          </div>
        </Alert>

        <Button
          type="submit"
          loading={loading}
          disabled={!formData.to || loading}
          className="w-full"
          size="lg"
        >
          <Zap className="w-5 h-5 mr-2" />
          {loading ? 'Processing...' : 'Send Gasless Transaction'}
        </Button>
      </form>
    </Card>
  );
};

export default TransactionForm;
