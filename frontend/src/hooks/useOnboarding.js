import { useState, useEffect } from 'react';

const useOnboarding = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    const isFirst = !hasCompletedOnboarding;
    
    setIsFirstVisit(isFirst);
    
    if (isFirst) {
      // Show onboarding after a short delay for better UX
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
    setIsFirstVisit(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
    setIsFirstVisit(false);
  };

  const restartOnboarding = () => {
    localStorage.removeItem('onboarding_completed');
    setCurrentStep(0);
    setCompletedSteps([]);
    setShowOnboarding(true);
    setIsFirstVisit(true);
  };

  const nextStep = () => {
    setCompletedSteps(prev => [...prev, currentStep]);
    setCurrentStep(prev => prev + 1);
  };

  const previousStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  return {
    isFirstVisit,
    showOnboarding,
    currentStep,
    completedSteps,
    setShowOnboarding,
    completeOnboarding,
    skipOnboarding,
    restartOnboarding,
    nextStep,
    previousStep,
    goToStep
  };
};

export default useOnboarding;
