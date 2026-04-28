import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: Props) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClass} border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin`} />
    </div>
  );
}
