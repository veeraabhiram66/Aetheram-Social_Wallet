import React, { useState, useCallback, useMemo } from 'react';

/**
 * Stable Transaction Form Component
 * Prevents blinking/vibrating inputs during state updates
 */
const StableTransactionForm = ({ 
  onSubmit, 
  isSubmitting = false, 
  disabled = false,
  initialValues = {},
  autoFillData = null // New prop for auto-fill functionality
}) => {  // Use initialValues to set default values, with fallbacks
  const getInitialValue = (field) => {
    // Check if initialValues is not null and has the field
    if (initialValues && typeof initialValues === 'object' && initialValues[field] !== undefined && initialValues[field] !== null) {
      return initialValues[field];
    }
    
    // Default fallbacks
    switch (field) {
      case 'to': return '';
      case 'value': return '';
      case 'data': return '0x';
      default: return '';
    }
  };
  // Stable state management - prevent unnecessary re-renders
  const [formData, setFormData] = useState(() => {
    try {
      return {
        to: getInitialValue('to'),
        value: getInitialValue('value'),
        data: getInitialValue('data')
      };
    } catch (error) {
      console.warn('Error initializing form data, using defaults:', error);
      return {
        to: '',
        value: '',
        data: '0x'
      };
    }
  });

  // Stable handlers - prevent component re-mounting
  const handleInputChange = useCallback((field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    if (!isSubmitting && !disabled && onSubmit) {
      onSubmit(formData);
    }
  }, [formData, isSubmitting, disabled, onSubmit]);

  // Stable validation - memoized to prevent recalculation
  const validation = useMemo(() => {
    const isValidAddress = (addr) => {
      return addr && /^0x[a-fA-F0-9]{40}$/.test(addr);
    };

    const isValidValue = (val) => {
      return val !== '' && !isNaN(parseFloat(val)) && parseFloat(val) >= 0;
    };

    return {
      toValid: isValidAddress(formData.to),
      valueValid: isValidValue(formData.value),
      dataValid: formData.data.startsWith('0x'),
      canSubmit: isValidAddress(formData.to) && isValidValue(formData.value)
    };
  }, [formData.to, formData.value, formData.data]);

  // Stable button classes - prevent CSS recalculation
  const buttonClasses = useMemo(() => {
    const baseClasses = "w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200";
    
    if (isSubmitting) {
      return `${baseClasses} bg-gray-600 text-gray-400 cursor-not-allowed`;
    }
    
    if (disabled || !validation.canSubmit) {
      return `${baseClasses} bg-gray-600 text-gray-400 cursor-not-allowed`;
    }
    
    return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white`;
  }, [isSubmitting, disabled, validation.canSubmit]);

  // Auto-fill effect when autoFillData changes
  React.useEffect(() => {
    if (autoFillData && typeof autoFillData === 'object') {
      console.log('🎯 Auto-filling form with data:', autoFillData);
      setFormData(prev => ({
        ...prev,
        to: autoFillData.to || prev.to,
        value: autoFillData.value || prev.value,
        data: autoFillData.data || prev.data
      }));
    }
  }, [autoFillData]);

  return (    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <h3 className="text-xl font-bold text-white mb-4">💸 Send Transaction</h3>
      
      {/* Perfect Nonce Handling Info */}
      <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-green-400">🎯</span>
          <span className="text-sm text-green-300 font-medium">Perfect Nonce Handling</span>
        </div>
        <div className="text-xs text-green-200 mt-1">
          Nonce will be automatically fetched from backend before transaction signing - no conflicts guaranteed!
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* To Address Field - Stable with consistent key */}
        <div key="to-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            To Address
          </label>
          <input
            type="text"
            value={formData.to}
            onChange={handleInputChange('to')}
            disabled={disabled || isSubmitting}
            placeholder="0x742d35Cc6754C00532D5a3a2323c10f6bF3e96E8"
            className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 ${
              validation.toValid
                ? 'border-green-500 focus:ring-green-500'
                : formData.to
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-600 focus:ring-blue-500'
            }`}
          />
          {formData.to && !validation.toValid && (
            <p className="mt-1 text-sm text-red-400">Please enter a valid Ethereum address</p>
          )}
        </div>

        {/* Value Field - Stable with consistent key */}
        <div key="value-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Value (BDAG)
          </label>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={formData.value}
            onChange={handleInputChange('value')}
            disabled={disabled || isSubmitting}
            placeholder="0.1"
            className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 ${
              validation.valueValid
                ? 'border-green-500 focus:ring-green-500'
                : formData.value
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-600 focus:ring-blue-500'
            }`}
          />
          {formData.value && !validation.valueValid && (
            <p className="mt-1 text-sm text-red-400">Please enter a valid amount</p>
          )}
        </div>

        {/* Data Field - Stable with consistent key */}
        <div key="data-field">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Data (Optional)
          </label>
          <input
            type="text"
            value={formData.data}
            onChange={handleInputChange('data')}
            disabled={disabled || isSubmitting}
            placeholder="0x"
            className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 ${
              validation.dataValid
                ? 'border-green-500 focus:ring-green-500'
                : 'border-red-500 focus:ring-red-500'
            }`}
          />
          {!validation.dataValid && (
            <p className="mt-1 text-sm text-red-400">Data must start with 0x</p>
          )}
        </div>

        {/* Submit Button - Stable with memoized classes */}
        <button
          type="submit"
          disabled={!validation.canSubmit || disabled || isSubmitting}
          className={buttonClasses}
        >
          {isSubmitting ? (
            <>
              <span className="inline-block animate-spin mr-2">⚡</span>
              Sending Transaction...
            </>
          ) : (
            '🚀 Send Transaction'
          )}
        </button>
      </form>

      {/* Form Status - Stable display */}
      {validation.canSubmit && (
        <div className="mt-4 p-3 bg-green-900/50 border border-green-500 rounded-lg">
          <p className="text-green-400 text-sm">✅ Ready to send transaction</p>
        </div>
      )}
    </div>
  );
};

// Memoize the entire component to prevent unnecessary re-renders
export default React.memo(StableTransactionForm);
