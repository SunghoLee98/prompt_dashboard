import React from 'react';
import { Bookmark } from 'lucide-react';

interface BookmarkCounterProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const BookmarkCounter: React.FC<BookmarkCounterProps> = ({
  count,
  size = 'sm',
  className = '',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (count === 0) return null;

  return (
    <span className={`flex items-center gap-1 ${textSizeClasses[size]} text-gray-500 ${className}`}>
      {showIcon && <Bookmark className={`${sizeClasses[size]} text-gray-400`} />}
      <span className="font-medium">{count.toLocaleString()}</span>
    </span>
  );
};