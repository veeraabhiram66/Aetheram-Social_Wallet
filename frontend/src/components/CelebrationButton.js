import React from 'react';
import { motion } from 'framer-motion';
import { useCelebration } from './CelebrationEffect';

const CelebrationButton = ({ 
  children = "🎉", 
  type = "success", 
  className = "",
  variant = "secondary",
  ...props 
}) => {
  const { celebrate } = useCelebration();

  const handleClick = () => {
    celebrate(type);
    if (props.onClick) {
      props.onClick();
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`
        inline-flex items-center justify-center px-3 py-2 rounded-lg
        transition-all duration-200 font-medium
        ${variant === 'primary' 
          ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md' 
          : variant === 'secondary'
          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
          : 'bg-transparent hover:bg-gray-100 text-gray-600'
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Quick celebration triggers for different scenarios
export const QuickCelebrations = () => {
  return (
    <div className="flex space-x-2">
      <CelebrationButton type="success" title="Success celebration">
        🎉
      </CelebrationButton>
      <CelebrationButton type="fireworks" title="Fireworks celebration">
        🎆
      </CelebrationButton>
      <CelebrationButton type="mega" title="Mega celebration">
        🚀
      </CelebrationButton>
    </div>
  );
};

export default CelebrationButton;
