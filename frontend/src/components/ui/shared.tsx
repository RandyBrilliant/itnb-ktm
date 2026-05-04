/**
 * Shared UI Components Library
 * Reusable button, card, badge, and layout components
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { COLORS } from '@/lib/constants';

/* ============================================================================
   BUTTON COMPONENT
   ============================================================================ */

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = 'right',
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'font-bold tracking-tight transition-all duration-150 flex items-center justify-center gap-2 rounded-lg';
    
    const variantStyles = {
      primary: `bg-[${COLORS.primary}] text-white hover:bg-[${COLORS['primary-container']}] disabled:opacity-50`,
      secondary: `bg-[${COLORS['surface-container-high']}] text-[${COLORS['on-surface']}] hover:bg-[${COLORS['surface-container-highest']}]`,
      danger: 'bg-red-600 text-white hover:bg-red-700',
      text: `text-[${COLORS.primary}] hover:bg-[${COLORS['surface-container-low']}]`,
    };

    const sizeStyles = {
      sm: 'px-3 py-2 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-4 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {iconPosition === 'left' && icon && icon}
        {children}
        {iconPosition === 'right' && icon && !loading && icon}
        {loading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

/* ============================================================================
   CARD COMPONENT
   ============================================================================ */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'filled' | 'outlined';
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    const variantStyles = {
      default: `bg-[${COLORS['surface-container-lowest']}] shadow-[${COLORS.primary}]`,
      elevated: `bg-[${COLORS['surface-container-lowest']}] shadow-md`,
      filled: `bg-[${COLORS['surface-container-low']}]`,
      outlined: `border border-[${COLORS['outline-variant']}]`,
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg overflow-hidden transition-all duration-300',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

/* ============================================================================
   BADGE COMPONENT
   ============================================================================ */

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
  size?: 'sm' | 'md';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'primary', size = 'sm', className, children, ...props }, ref) => {
    const variantStyles = {
      primary: `bg-[${COLORS.primary}] text-white`,
      success: `bg-[${COLORS.success}] text-green-900`,
      warning: `bg-[${COLORS.warning}] text-yellow-900`,
      danger: `bg-red-100 text-red-900`,
      secondary: `bg-[${COLORS['secondary-container']}] text-[${COLORS['on-secondary-container']}]`,
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'font-bold rounded-full inline-block whitespace-nowrap tracking-tight uppercase',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

/* ============================================================================
   PAGE HEADER COMPONENT
   ============================================================================ */

export interface PageHeaderProps {
  label?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  label,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex gap-4 items-start mb-8">
      <div className="w-1.5 self-stretch bg-[#af0f24]" />
      <div className="flex-1">
        {label && (
          <p className="text-[#af0f24] font-bold text-xs tracking-widest uppercase mb-1">
            {label}
          </p>
        )}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1a1c1c]">
            {title}
          </h1>
          {action && <div>{action}</div>}
        </div>
        {description && (
          <p className="text-[#5f5e5e] text-sm mt-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   STAT CARD COMPONENT
   ============================================================================ */

export interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
  };
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  trend,
  description,
}) => {
  const trendIcon = trend?.direction === 'up' ? '↑' : trend?.direction === 'down' ? '↓' : '→';
  const trendColor =
    trend?.direction === 'up'
      ? 'text-green-600'
      : trend?.direction === 'down'
      ? 'text-red-600'
      : 'text-gray-600';

  return (
    <Card variant="filled" className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[#5f5e5e] text-sm font-medium mb-2">{label}</p>
          <p className="text-3xl font-black text-[#1a1c1c]">{value}</p>
          {description && (
            <p className="text-xs text-[#5f5e5e] mt-2">{description}</p>
          )}
        </div>
        {icon && <div className="text-4xl opacity-50">{icon}</div>}
      </div>
      {trend && (
        <div className={`mt-4 flex items-center gap-1 text-sm font-bold ${trendColor}`}>
          <span>{trendIcon}</span>
          <span>{trend.percentage}%</span>
        </div>
      )}
    </Card>
  );
};

/* ============================================================================
   LOADING SKELETON
   ============================================================================ */

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'bg-[#f3f3f3] animate-pulse rounded-lg',
      className
    )}
  />
);

/* ============================================================================
   EMPTY STATE
   ============================================================================ */

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon && <div className="text-4xl mb-4 opacity-40">{icon}</div>}
    <h3 className="text-xl font-bold text-[#1a1c1c] mb-2">{title}</h3>
    {description && (
      <p className="text-[#5f5e5e] text-sm mb-6">{description}</p>
    )}
    {action && <div>{action}</div>}
  </div>
);

/* ============================================================================
   ERROR STATE
   ============================================================================ */

export interface ErrorStateProps {
  title?: string;
  message: string;
  action?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error',
  message,
  action,
}) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
    <h3 className="text-lg font-bold text-red-900 mb-2">{title}</h3>
    <p className="text-red-700 text-sm mb-4">{message}</p>
    {action && <div>{action}</div>}
  </div>
);

/* ============================================================================
   DIVIDER COMPONENT
   ============================================================================ */

export const Divider: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('border-t border-[#e2e2e2]', className)} />
);

/* ============================================================================
   SECTION COMPONENT
   ============================================================================ */

export interface SectionProps {
  title?: string | React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  description,
  children,
  className,
}) => (
  <section className={cn('mb-8', className)}>
    {title && (
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#1a1c1c]">{title}</h2>
        {description && (
          <p className="text-sm text-[#5f5e5e] mt-1">{description}</p>
        )}
      </div>
    )}
    {children}
  </section>
);
