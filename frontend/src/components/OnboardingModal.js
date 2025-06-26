import React from 'react';
import { X, ArrowRight, ArrowLeft, Shield, Users, Activity, Zap } from 'lucide-react';

const OnboardingModal = ({ 
  isOpen, 
  currentStep, 
  onNext, 
  onPrevious, 
  onSkip, 
  onComplete,
  onClose 
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to BlockDAG Smart Wallet!",
      content: "Your secure, social recovery-enabled wallet for the BlockDAG network.",
      icon: <Zap className="w-12 h-12 text-purple-500" />,
      action: "Let's get started!"
    },
    {
      title: "Connect Your Wallet",
      content: "First, connect your existing wallet or create a new one. This will be your primary account for transactions.",
      icon: <Shield className="w-12 h-12 text-blue-500" />,
      action: "Connect wallet in the top-right corner",
      highlight: ".wallet-connect-button" // CSS selector to highlight
    },
    {
      title: "Add Guardians",
      content: "Set up trusted guardians who can help you recover your wallet if you lose access. This is your safety net!",
      icon: <Users className="w-12 h-12 text-green-500" />,
      action: "Go to the Guardians tab and add at least 2 guardians",
      highlight: ".guardians-tab"
    },
    {
      title: "Make Your First Transaction",
      content: "Try sending some BDAG using the smart wallet. It's fast, secure, and gas-efficient!",
      icon: <Activity className="w-12 h-12 text-orange-500" />,
      action: "Use the Transaction tab to send BDAG",
      highlight: ".transaction-tab"
    },
    {
      title: "You're All Set!",
      content: "🎉 Congratulations! You now have a fully-featured smart wallet with social recovery. Explore the analytics and transaction history tabs to see more features.",
      icon: <Shield className="w-12 h-12 text-purple-500" />,
      action: "Start using your smart wallet!"
    }
  ];

  const currentStepData = steps[currentStep] || steps[0];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-portal-pop">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {currentStepData.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentStepData.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6 text-base leading-relaxed">
            {currentStepData.content}
          </p>

          {currentStepData.action && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
              <p className="text-purple-800 dark:text-purple-300 text-sm font-medium">
                💡 Next action: {currentStepData.action}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <button
              onClick={onSkip}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Skip Tutorial
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {!isFirstStep && (
              <button
                onClick={onPrevious}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            )}

            <button
              onClick={isLastStep ? onComplete : onNext}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all"
            >
              <span>{isLastStep ? "Get Started" : "Next"}</span>
              {!isLastStep && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
