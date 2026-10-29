import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-sans font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-terracotta disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-btn space-x-1.5',
    md: 'text-xs uppercase tracking-wider font-semibold px-4 py-2.5 rounded-btn space-x-2',
    lg: 'text-sm uppercase tracking-wider font-semibold px-6 py-3 rounded-btn space-x-2.5',
  }[size] || 'text-xs px-4 py-2.5 rounded-btn space-x-2';

  const variantClasses = {
    // Primary Action: Terracotta (#803E2F, hover #6B3326)
    primary: 'bg-terracotta text-page hover:bg-terracotta-hover active:bg-terracotta-hover/90 border border-transparent',
    
    // Secondary: Light surface with hairline border
    secondary: 'bg-transparent text-charcoal border border-border-hairline hover:bg-surface-alt active:bg-surface-muted',
    
    // Obsidian Dark
    obsidian: 'bg-obsidian text-page hover:bg-obsidian-light active:bg-obsidian-dark border border-transparent',
    
    // Burgundy Pill/Selected
    burgundy: 'bg-burgundy text-page hover:bg-burgundy-hover border border-transparent',
    
    // Danger / Removal
    danger: 'bg-status-error text-page hover:bg-status-error/90 border border-transparent',
    
    // Danger Outline
    'danger-outline': 'bg-transparent text-status-error border border-status-error/40 hover:bg-status-error-bg active:bg-status-error-bg',

    // Ghost
    ghost: 'bg-transparent text-charcoal hover:bg-surface-alt/70 active:bg-surface-alt',
  }[variant] || 'bg-terracotta text-page hover:bg-terracotta-hover';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
}

