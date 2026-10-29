import React from 'react';

/**
 * Reusable PageHeader component matching approved Armonia / Elias Varr editorial aesthetics
 * - Small uppercase eyebrow with tracking
 * - High-contrast Cormorant Garamond display heading with optional italic accent
 * - Secondary muted description
 * - Right-aligned optional action slot
 */
export default function PageHeader({
  eyebrow,
  title,
  italicAccent,
  description,
  actions,
  className = '',
}) {
  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between pb-8 mb-10 border-b border-border-hairline gap-5 ${className}`}>
      <div className="space-y-2 max-w-3xl">

        <h1 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-display font-medium text-obsidian tracking-[-0.025em] leading-[1.02]">
          {title}{' '}
          {italicAccent && (
              <em className="font-display italic font-medium text-burgundy">
              {italicAccent}
            </em>
          )}
        </h1>

        {description && (
          <p className="text-sm sm:text-base text-secondary-text font-normal pt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center space-x-3 shrink-0 self-start md:self-end">
          {actions}
        </div>
      )}
    </div>
  );
}

