import React from 'react';

export default function Card({
  children,
  variant = 'surface', // 'surface' | 'alt' | 'obsidian' | 'flat'
  className = '',
  ...props
}) {
  const variantStyles = {
    // Content sections use the canvas as their surface. Hairlines, not elevation,
    // establish grouping so the page does not become a grid of floating cards.
    surface: 'bg-transparent border-y border-border-hairline shadow-none',
    alt: 'bg-surface-alt/45 border-y border-border-hairline shadow-none',
    obsidian: 'bg-obsidian text-page border border-obsidian-light shadow-none',
    flat: 'bg-transparent border-y border-border-hairline shadow-none',
  }[variant] || 'bg-transparent border-y border-border-hairline shadow-none';

  return (
    <div
      className={`rounded-none p-5 sm:p-6 transition-colors duration-150 ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

