// frontend/src/components/shared/Card.jsx
import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle,
  action,
  hover = false,
  className = '',
  bodyClassName = '',
  ...props 
}) => {
  const cardClasses = [
    'card',
    hover && 'card-hover cursor-pointer',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      
      <div className={bodyClassName}>
        {children}
      </div>
    </div>
  );
};

export default Card;