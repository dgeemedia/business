// frontend/src/components/shared/EmptyState.jsx
import React from 'react';
import Button from './Button';

const EmptyState = ({ 
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-gray-500 max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action ? (
        action
      ) : actionLabel && onAction ? (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};

export default EmptyState;