import React, { useState } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { followUser, unfollowUser } from '../../api/follow';

interface FollowButtonProps {
  userId: number;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  isFollowing: initialFollowing,
  onFollowChange,
  className = '',
  size = 'md'
}) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);

    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await followUser(userId);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error('Failed to toggle follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const baseClasses = 'inline-flex items-center gap-2 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const colorClasses = isFollowing
    ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <button
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={`${baseClasses} ${colorClasses} ${sizeClasses[size]} ${className}`}
      data-testid={`follow-button-${userId}`}
    >
      {isLoading ? (
        <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSize[size]}`} />
      ) : (
        <>
          {isFollowing ? (
            <>
              <UserCheck className={iconSize[size]} />
              <span>Following</span>
            </>
          ) : (
            <>
              <UserPlus className={iconSize[size]} />
              <span>Follow</span>
            </>
          )}
        </>
      )}
    </button>
  );
};