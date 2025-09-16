import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toggleBookmark, getBookmarkStatus } from '../../api/bookmarks';
import { useAuth } from '../../contexts/AuthContext';
import type { BookmarkToggleResponse, BookmarkStatus } from '../../types/bookmark';

interface BookmarkButtonProps {
  promptId: number;
  isBookmarked?: boolean;
  bookmarkCount: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
  onBookmarkChange?: (bookmarked: boolean, count: number) => void;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  promptId,
  isBookmarked: initialBookmarked = false,
  bookmarkCount: initialCount = 0,
  size = 'sm',
  showCount = true,
  className = '',
  onBookmarkChange,
}) => {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Size variants matching PromptCard style
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

  // Sync bookmark status when user changes or component mounts
  useEffect(() => {
    const fetchBookmarkStatus = async () => {
      if (!user || !promptId) return;

      try {
        const status: BookmarkStatus = await getBookmarkStatus(promptId);
        setIsBookmarked(status.bookmarked);
      } catch (err) {
        console.error('Failed to fetch bookmark status:', err);
      }
    };

    fetchBookmarkStatus();
  }, [user, promptId]);

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if inside Link
    e.stopPropagation(); // Prevent event bubbling

    if (!user) {
      setError('로그인이 필요합니다.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (isLoading) return;

    // Optimistic UI update
    const wasBookmarked = isBookmarked;
    const previousCount = bookmarkCount;
    setIsBookmarked(!wasBookmarked);
    setBookmarkCount(wasBookmarked ? previousCount - 1 : previousCount + 1);

    setIsLoading(true);
    setError(null);

    try {
      const response: BookmarkToggleResponse = await toggleBookmark(promptId);
      setIsBookmarked(response.bookmarked);
      setBookmarkCount(response.bookmarkCount);

      // Notify parent component
      onBookmarkChange?.(response.bookmarked, response.bookmarkCount);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      // Revert optimistic update on error
      setIsBookmarked(wasBookmarked);
      setBookmarkCount(previousCount);
      setError('북마크 처리 중 오류가 발생했습니다.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleBookmarkToggle(e as any);
    }
  };

  // Show read-only state for non-authenticated users
  if (!user) {
    return showCount ? (
      <span
        className={`flex items-center gap-1 ${textSizeClasses[size]} text-gray-500 ${className}`}
        data-testid="bookmark-button-readonly"
      >
        <Bookmark className={`${sizeClasses[size]} text-gray-400`} />
        <span data-testid="bookmark-count">{bookmarkCount}</span>
      </span>
    ) : null;
  }

  return (
    <div className="relative">
      <button
        onClick={handleBookmarkToggle}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className={`
          flex items-center gap-1 transition-all duration-200
          ${textSizeClasses[size]}
          ${isBookmarked
            ? 'text-blue-600 hover:text-blue-700'
            : 'text-gray-500 hover:text-blue-600'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-sm
          ${className}
        `}
        aria-label={isBookmarked ? '북마크 해제' : '북마크 추가'}
        aria-pressed={isBookmarked}
        title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        data-testid="bookmark-button"
      >
        {isLoading ? (
          <div className={`${sizeClasses[size]} animate-spin`}>
            <div className="h-full w-full border-2 border-current border-t-transparent rounded-full opacity-60"></div>
          </div>
        ) : (
          <>
            {isBookmarked ? (
              <BookmarkCheck
                className={`${sizeClasses[size]} fill-current transition-all duration-300 transform`}
                strokeWidth={1.5}
              />
            ) : (
              <Bookmark
                className={`${sizeClasses[size]} transition-transform duration-200 hover:scale-110`}
                strokeWidth={1.5}
              />
            )}
          </>
        )}

        {showCount && (
          <span className={isLoading ? 'opacity-60' : ''} data-testid="bookmark-count">
            {bookmarkCount}
          </span>
        )}
      </button>

      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-red-600 text-white text-xs rounded whitespace-nowrap shadow-lg z-20">
          {error}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-red-600"></div>
        </div>
      )}
    </div>
  );
};