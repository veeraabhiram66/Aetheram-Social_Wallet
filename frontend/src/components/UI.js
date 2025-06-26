import React from 'react';
import { 
  Wallet, 
  Zap, 
  Shield, 
  Users, 
  Activity,
  ExternalLink,
  Copy,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';

// Loading Spinner Component - CSS Animation Only
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div
      className={`${sizeClasses[size]} ${className} animate-spin`}
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <Loader className="w-full h-full text-blue-500" />
    </div>
  );
};

// (Old Button component removed - use StableButton instead)

// Ultra-Simple Button - Zero Blinking, Zero CSP Issues
export const StableButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) => {
  // Absolutely minimal classes - no fancy effects
  let buttonClasses = 'relative inline-flex items-center justify-center font-medium rounded-md border cursor-pointer';
  
  // Add size
  if (size === 'sm') buttonClasses += ' px-3 py-1.5 text-sm';
  else if (size === 'lg') buttonClasses += ' px-6 py-3 text-lg';
  else buttonClasses += ' px-4 py-2 text-base';
    // Add variant with dark mode support
  if (variant === 'primary') {
    buttonClasses += ' bg-blue-600 dark:bg-purple-600 text-white border-blue-600 dark:border-purple-600';
    if (!disabled && !loading) buttonClasses += ' hover:bg-blue-700 dark:hover:bg-purple-700';
  } else if (variant === 'secondary') {
    buttonClasses += ' bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600';
    if (!disabled && !loading) buttonClasses += ' hover:bg-gray-300 dark:hover:bg-gray-600';
  } else if (variant === 'success') {
    buttonClasses += ' bg-green-600 text-white border-green-600';
    if (!disabled && !loading) buttonClasses += ' hover:bg-green-700';
  } else if (variant === 'danger') {
    buttonClasses += ' bg-red-600 text-white border-red-600';
    if (!disabled && !loading) buttonClasses += ' hover:bg-red-700';
  } else if (variant === 'outline') {
    buttonClasses += ' bg-white dark:bg-gray-800 text-blue-600 dark:text-purple-400 border-blue-600 dark:border-purple-400';
    if (!disabled && !loading) buttonClasses += ' hover:bg-blue-50 dark:hover:bg-gray-700';
  } else if (variant === 'ghost') {
    buttonClasses += ' bg-transparent text-gray-700 dark:text-gray-300 border-transparent';
    if (!disabled && !loading) buttonClasses += ' hover:bg-gray-100 dark:hover:bg-gray-700';
  }
  
  // Add disabled state
  if (disabled || loading) {
    buttonClasses += ' opacity-50 cursor-not-allowed';
  }
  
  // Add custom classes
  if (className) {
    buttonClasses += ' ' + className;
  }

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      type="button"
      {...props}
    >
      <span className={loading ? 'invisible' : 'inline-flex items-center'}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </span>
      )}
    </button>
  );
};

// Export StableButton as Button for backward compatibility
export const Button = StableButton;

// Card Component - No Animation to Prevent Blinking - Updated for dark mode
export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Alert Component with dark mode support
export const Alert = ({ type = 'info', children, className = '', onClose }) => {
  const types = {
    info: { 
      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', 
      text: 'text-blue-800 dark:text-blue-300', 
      icon: AlertCircle 
    },
    success: { 
      bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', 
      text: 'text-green-800 dark:text-green-300', 
      icon: CheckCircle 
    },
    warning: { 
      bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800', 
      text: 'text-yellow-800 dark:text-yellow-300', 
      icon: AlertCircle 
    },
    error: { 
      bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', 
      text: 'text-red-800 dark:text-red-300', 
      icon: AlertCircle 
    }
  };

  const { bg, text, icon: Icon } = types[type];
  return (
    <div className={`p-4 rounded-lg border transition-colors duration-300 ${bg} ${text} ${className}`}>
      <div className="flex items-start">
        <Icon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

// Input Component - Updated for dark mode
export const Input = ({ 
  label, 
  error, 
  className = '', 
  containerClassName = '',
  ...props 
}) => {
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm
          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          dark:focus:ring-blue-400 dark:focus:border-blue-400
          disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400
          placeholder-gray-400 dark:placeholder-gray-500
          transition-colors duration-300
          ${error ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 transition-colors duration-300">{error}</p>
      )}
    </div>
  );
};

// Badge Component - Updated for dark mode
export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    success: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
    warning: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
    error: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
    info: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Copy to Clipboard Component
export const CopyButton = ({ text, className = '' }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  return (
    <StableButton
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={`${className}`}
    >
      {copied ? (
        <>
          <CheckCircle className="w-4 h-4 mr-1" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-1" />
          Copy
        </>
      )}
    </StableButton>
  );
};

// Address Display Component
export const AddressDisplay = ({ address, showCopy = true, chars = 4 }) => {
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 2 + chars)}...${addr.slice(-chars)}`;
  };
  return (
    <div className="flex items-center space-x-2">
      <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono text-gray-900 dark:text-white">
        {formatAddress(address)}
      </code>
      {showCopy && <CopyButton text={address} />}
    </div>
  );
};

// Transaction Hash Display
export const TxHashDisplay = ({ txHash, explorerUrl = null }) => {
  const formatHash = (hash) => {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };
  return (
    <div className="flex items-center space-x-2">
      <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono text-gray-900 dark:text-white">
        {formatHash(txHash)}
      </code>
      <CopyButton text={txHash} />
      {explorerUrl && (
        <a
          href={`${explorerUrl}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  );
};

// Stats Grid Component - Updated for dark mode
export const StatsGrid = ({ stats }) => {
  const iconMap = {
    transactions: Activity,
    balance: Wallet,
    gas_saved: Zap,
    guardians: Shield,
    users: Users
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(stats).map(([key, value]) => {
        const Icon = iconMap[key] || Activity;
        return (
          <Card key={key} className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Icon className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-300">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 capitalize transition-colors duration-300">
                  {key.replace('_', ' ')}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// Modal Component
export const Modal = ({ isOpen, onClose, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200 dark:border-gray-700">
          <div className={className}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
