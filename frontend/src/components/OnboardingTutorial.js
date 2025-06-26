import React from 'react';
import { X, ArrowRight, ArrowLeft, Wallet, Shield, RefreshCw } from 'lucide-react';

const OnboardingTutorial = ({
  isVisible,
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  totalSteps = 4
}) => {
  if (!isVisible) return null;

  const steps = [
    {
      title: "Welcome to BlockDAG Smart Wallet",
      description: "Your secure, guardian-protected wallet with social recovery features.",
      icon: <Wallet className="w-16 h-16 text-blue-500" />,
      content: "This tutorial will guide you through setting up your smart wallet, adding guardians, and using advanced features like transaction analytics.",
      action: "Get Started"
    },
    {
      title: "Connect Your Wallet",
      description: "First, connect your wallet to access all features.",
      icon: <Wallet className="w-16 h-16 text-purple-500" />,
      content: "Click the 'Connect Wallet' button to link your MetaMask or compatible wallet. This is required to interact with the blockchain.",
      action: "Next: Guardians"
    },
    {
      title: "Set Up Guardians",
      description: "Add trusted guardians for social recovery.",
      icon: <Shield className="w-16 h-16 text-green-500" />,
      content: "Guardians can help you recover your wallet if you lose access. Add at least 2-3 trusted friends or family members as guardians.",
      action: "Next: Features"
    },
    {
      title: "Explore Features",
      description: "Discover analytics, transaction history, and more!",
      icon: <RefreshCw className="w-16 h-16 text-orange-500" />,
      content: "Check out the Transaction Dashboard for analytics, view your transaction history, and explore the demo mode to see sample data.",
      action: "Get Started!"
    }
  ];

  const currentStepData = steps[currentStep] || steps[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Skip tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {currentStepData.icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {currentStepData.description}
            </p>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {currentStepData.content}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={onPrevious}
              disabled={currentStep === 0}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg transition-all
                ${currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentStep === totalSteps - 1 ? (
              <button
                onClick={onComplete}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
              >
                <span>{currentStepData.action}</span>
              </button>
            ) : (
              <button
                onClick={onNext}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
              >
                <span>{currentStepData.action}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Skip option */}
          <div className="text-center mt-4">
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
