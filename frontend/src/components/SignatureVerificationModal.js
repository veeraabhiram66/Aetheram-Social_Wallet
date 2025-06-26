import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

// Simple Modal structure
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// Simple Button
const Button = ({ children, onClick, variant = 'primary' }) => {
    const baseClasses = "px-4 py-2 rounded-md font-semibold flex items-center justify-center";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
    };
    return <button onClick={onClick} className={`${baseClasses} ${variants[variant]}`}>{children}</button>;
}

// Simple CodeBlock
const CodeBlock = ({ code, language = 'json' }) => {
    const formattedCode = typeof code === 'string' ? code : JSON.stringify(code, null, 2);
    return (
        <pre className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 text-sm text-left overflow-x-auto max-h-40">
            <code className={`language-${language}`}>
                {formattedCode}
            </code>
        </pre>
    );
};


function SignatureVerificationModal({ isOpen, onConfirm, onCancel, signatureData }) {
  console.log('🔍 SignatureVerificationModal render:', { isOpen, hasSignatureData: !!signatureData });
  
  if (!isOpen) return null;
  
  // If modal should be open but no signature data, show an error state
  if (!signatureData) {
    return (
      <Modal isOpen={isOpen} onClose={onCancel} title="Error: Missing Signature Data">
        <div className="space-y-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            The signature verification modal was opened but no signature data was provided.
            This indicates a bug in the transaction flow.
          </p>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onCancel}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  const { signature, signer, nonce, to, value, data, verifyingContract } = signatureData;

  const displayData = {
    transaction: {
      to: to,
      value: `${value} BDAG`,
      data: data,
      nonce: nonce
    },
    signature: {
      signature: signature,
      signer: signer,
      verifyingContract: verifyingContract
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Verify Signature & Confirm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please review the transaction details and the generated EIP-712 signature before sending it to the relayer.
        </p>
        
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Transaction Details</h4>
          <CodeBlock code={displayData.transaction} />
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Signature Information</h4>
          <CodeBlock code={displayData.signature} />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button variant="secondary" onClick={onCancel}>
            <XCircle className="w-5 h-5 mr-2" />
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            <CheckCircle className="w-5 h-5 mr-2" />
            Confirm & Send
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SignatureVerificationModal;
