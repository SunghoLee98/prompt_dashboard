import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showValue = false,
  className = '',
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent, rating: number) => {
    if (!readonly && onChange) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onChange(rating);
      } else if (event.key === 'ArrowRight' && rating < 5) {
        event.preventDefault();
        onChange(rating + 1);
      } else if (event.key === 'ArrowLeft' && rating > 1) {
        event.preventDefault();
        onChange(rating - 1);
      }
    }
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div 
        className={`flex gap-0.5 ${!readonly ? 'cursor-pointer' : ''}`}
        onMouseLeave={handleMouseLeave}
        role="radiogroup"
        aria-label="Rating"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={value}
      >
        {[1, 2, 3, 4, 5].map((rating) => {
          const isFilled = rating <= displayValue;
          const isHalf = rating === Math.ceil(displayValue) && displayValue % 1 !== 0;
          
          return (
            <button
              key={rating}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onKeyDown={(e) => handleKeyDown(e, rating)}
              disabled={readonly}
              className={`relative focus:outline-none rating-star star-button ${!readonly ? 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded' : ''} ${isFilled ? 'active filled selected' : ''}`}
              data-testid="rating-star"
              role="radio"
              aria-checked={rating === Math.round(value)}
              aria-label={`${rating} star${rating !== 1 ? 's' : ''}`}
              tabIndex={readonly ? -1 : rating === Math.round(value) ? 0 : -1}
            >
              <Star
                className={`${sizeClasses[size]} transition-colors ${
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-transparent text-gray-300'
                } ${!readonly ? 'hover:text-yellow-400' : ''}`}
              />
              {isHalf && (
                <Star
                  className={`${sizeClasses[size]} absolute inset-0 fill-yellow-400 text-yellow-400`}
                  style={{ clipPath: 'inset(0 50% 0 0)' }}
                />
              )}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={`ml-2 text-gray-600 ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : ''}`}>
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
};