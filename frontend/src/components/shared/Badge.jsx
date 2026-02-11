// frontend/src/components/shared/Badge.jsx
import React from 'react';

const Badge = ({ 
  children, 
  variant = 'gray',
  size = 'md',
  icon: Icon,
  dot = false,
  className = '' 
}) => {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    gray: 'badge-gray',
    primary: 'bg-primary-100 text-primary-800',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  const classes = [
    'badge inline-flex items-center gap-1.5',
    variants[variant],
    sizes[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-green-600' :
          variant === 'warning' ? 'bg-yellow-600' :
          variant === 'danger' ? 'bg-red-600' :
          variant === 'info' ? 'bg-blue-600' :
          'bg-gray-600'
        }`} />
      )}
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

export default Badge;