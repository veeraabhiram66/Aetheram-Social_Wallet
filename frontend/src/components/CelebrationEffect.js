import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const CelebrationEffect = ({ 
  isActive, 
  onComplete,
  type = 'success' // 'success', 'mega', 'fireworks'
}) => {
  const timeoutRef = useRef(null);

  const triggerSuccessConfetti = () => {
    // Basic success confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
    });
  };

  const triggerMegaConfetti = () => {
    // Multi-burst confetti for major successes
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#EF4444', '#F97316', '#84CC16', '#06B6D4']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const triggerFireworks = () => {
    // Fireworks effect for special celebrations
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 0
    };

    const shoot = () => {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ['star'],
        colors: ['#FFE400', '#FFBD00', '#E89611', '#E89611', '#FFCA08']
      });

      confetti({
        ...defaults,
        particleCount: 10,
        scalar: 0.75,
        shapes: ['circle'],
        colors: ['#26CCFF', '#A25AFF', '#FF5EBA', '#88FF5A', '#FCFF42']
      });
    };

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  };
  useEffect(() => {
    const triggerCelebration = () => {
      switch (type) {
        case 'mega':
          triggerMegaConfetti();
          break;
        case 'fireworks':
          triggerFireworks();
          break;
        case 'success':
        default:
          triggerSuccessConfetti();
          break;
      }

      // Auto-complete after animation duration
      timeoutRef.current = setTimeout(() => {
        if (onComplete) onComplete();
      }, type === 'mega' ? 3000 : 1500);
    };

    if (isActive) {
      triggerCelebration();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, type, onComplete]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
};

// Hook for easy celebration triggering
export const useCelebration = () => {
  const celebrate = (type = 'success') => {
    switch (type) {
      case 'mega':
        // Multi-burst confetti
        const duration = 3000;
        const end = Date.now() + duration;
        const frame = () => {
          confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']
          });
          confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#EF4444', '#F97316', '#84CC16', '#06B6D4']
          });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
        break;

      case 'fireworks':
        // Fireworks effect
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const shoot = () => {
          confetti({
            ...defaults,
            particleCount: 40,
            scalar: 1.2,
            shapes: ['star'],
            colors: ['#FFE400', '#FFBD00', '#E89611', '#FFCA08']
          });
          confetti({
            ...defaults,
            particleCount: 10,
            scalar: 0.75,
            shapes: ['circle'],
            colors: ['#26CCFF', '#A25AFF', '#FF5EBA', '#88FF5A', '#FCFF42']
          });
        };
        setTimeout(shoot, 0);
        setTimeout(shoot, 100);
        setTimeout(shoot, 200);
        break;

      case 'success':
      default:
        // Basic success confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
        });
        break;
    }
  };

  return { celebrate };
};

export default CelebrationEffect;
